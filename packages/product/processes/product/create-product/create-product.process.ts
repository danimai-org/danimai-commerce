import {
  InjectDB,
  InjectLogger,
  InternalServerError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  slugify,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateProductProcessInput,
  type CreateProductProcessOutput,
  CreateProductSchema,
  ProductVariantPriceSchema,
} from "./create-product.schema";
import type {
  Database,
  NewProductVariantOptionRelation,
  Product,
  ProductCategory,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantOptionRelation,
} from "../../../db/type";
import { randomUUID } from "crypto";
import type { Price, PriceSet } from "@danimai/pricing";
import type { Static } from "@sinclair/typebox";

/**
 * Handles the create product process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_PRODUCT_PROCESS = Symbol("CreateProduct");

/**
 * Creates a product with optional variants, options, pricing, and relations.
 * Input: validated product creation payload including optional nested entities.
 * Output: created product row persisted with related records.
 */
@Process(CREATE_PRODUCT_PROCESS)
export class CreateProductProcess implements ProcessContract<
  typeof CreateProductSchema,
  CreateProductProcessOutput
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({
      schema: CreateProductSchema,
    })
    context: ProcessContextType<typeof CreateProductSchema>,
  ) {
    const { input } = context;
    let createdProductId = "";

    const trx = this.db;

    await sql`begin`.execute(trx);

    try {
      // ── Validate category ──────────────────────────────────────────────
      // Ensure the referenced category exists before attaching it to the product

      if (input.category_id) {
        const category = await trx
          .selectFrom("product_categories")
          .where("id", "=", input.category_id)
          .where("deleted_at", "is", null)
          .selectAll()
          .executeTakeFirst();

        if (!category) {
          throw new ValidationError("Category not found", [
            {
              type: "not_found",
              message: "Category not found",
              path: "category_id",
            },
          ]);
        }
      }

      if (input.category_id && input.attributes && input.attributes.length > 0) {
        const attributes = await trx
          .selectFrom("product_attributes")
          .innerJoin("product_category_attribute_relations", (join) =>
            join
              .onRef(
                "product_category_attribute_relations.product_attribute_id",
                "=",
                "product_attributes.id",
              )
              .on(
                "product_category_attribute_relations.category_id",
                "=",
                input.category_id!,
              ),
          )
          .where(
            "product_category_attribute_relations.product_attribute_id",
            "in",
            input.attributes.map((a) => a.attribute_id),
          )
          .where("product_attributes.deleted_at", "is", null)
          .select("product_attributes.id")
          .execute();

        if (attributes.length !== input.attributes.length) {
          throw new ValidationError("One or more attributes are not linked to this category", [
            {
              type: "not_found",
              message: "One or more attributes are not linked to this category",
              path: "attributes",
            },
          ]);
        }
      }

      let handle: string;

      if (input.handle) {
        const existing = await trx
          .selectFrom("products")
          .where("handle", "=", input.handle)
          .where("deleted_at", "is", null)
          .select("id")
          .executeTakeFirst();

        if (existing) {
          throw new ValidationError("Product handle already exists", [
            {
              type: "not_unique",
              message: "Product handle already exists",
              path: "handle",
            },
          ]);
        }
        handle = input.handle;
      } else {
        const baseHandle = slugify(input.title);

        // One prefix query avoids repeated handle lookups while still producing unique handles.
        const existingHandles = await trx
          .selectFrom("products")
          .where("handle", "like", `${baseHandle}%`)
          .where("deleted_at", "is", null)
          .select("handle")
          .execute();
        const handleSet = new Set(existingHandles.map((row) => row.handle));

        handle = baseHandle;
        if (handleSet.has(handle)) {
          let counter = 1;
          while (handleSet.has(`${baseHandle}-${counter}`)) {
            counter++;
          }
          handle = `${baseHandle}-${counter}`;
        }
      }

      // ── Insert the product record ──────────────────────────────────────

      const product = await trx
        .insertInto("products")
        .values({
          id: randomUUID(),
          title: input.title,
          handle,
          description: input.description,
          is_giftcard: input.is_giftcard,
          discountable: input.discountable,
          status: input.status,
          thumbnail: input.thumbnail,
          external_id: input.external_id,
          category_id: input.category_id,
          metadata: input.metadata,
        })
        .returningAll()
        .executeTakeFirst();

      if (!product) {
        throw new InternalServerError("Failed to create product");
      }
      createdProductId = product.id;

      await this.attachMediaToOwner(trx, {
        ownerType: "product",
        ownerId: product.id,
        mediaIds: input.media_ids,
        thumbnailMediaId: input.thumbnail_media_id,
        updateThumbnailTable: "products",
      });

      // ── Create product options & option values ─────────────────────────
      // Options are global: reuse existing option by title (case-insensitive).
      // Option values are scoped to (option + product).
      // Returns a map of option_title -> { option_id, values: { value -> option_value_id } }

      let options: ProductOption[] = [];
      let optionValues: ProductOptionValue[] = [];

      if (input.options && input.options.length > 0) {
        const existingOptions = await trx
          .selectFrom("product_options")
          .where(
            sql`lower(title)`,
            "in",
            input.options.map((o) => sql`lower(${o.title})`),
          )
          .where("deleted_at", "is", null)
          .selectAll()
          .execute();
        const optionsToCreate = input.options.filter(
          (o) => !existingOptions.some((eo) => eo.title === o.title),
        );
        if (optionsToCreate.length > 0) {
          options = await trx
            .insertInto("product_options")
            .values(
              optionsToCreate.map((o) => ({
                id: randomUUID(),
                title: o.title,
                metadata: null,
              })),
            )
            .returningAll()
            .execute();
        }
        options = [...existingOptions, ...options];

        if (input.options && input.options.length > 0) {
          optionValues = await trx
            .insertInto("product_option_values")
            .values(
              input.options
                .map((o, rank) => ({
                  id: randomUUID(),
                  value: o.title,
                  option_id:
                    options.find((option) => option.title === o.title)?.id ??
                    "",
                  product_id: product.id,
                  rank: rank,
                }))
                .filter((o) => o.option_id !== ""),
            )
            .returningAll()
            .execute();
        }
      }

      // ── Create product variants with option relations and prices ───────
      if (input.variants && input.variants.length > 0) {
        const variantsToCreate = input.variants.map((variantInput) => ({
          id: randomUUID(),
          title: variantInput.title,
          product_id: product.id,
          sku: variantInput.sku,
          barcode: variantInput.barcode,
          ean: variantInput.ean,
          upc: variantInput.upc,
          allow_backorder: variantInput.allow_backorder ?? false,
          manage_inventory: variantInput.manage_inventory ?? true,
          variant_rank: variantInput.variant_rank,
          thumbnail: variantInput.thumbnail,
          metadata: variantInput.metadata,
        }));

        const createdVariants = await trx
          .insertInto("product_variants")
          .values(variantsToCreate)
          .returningAll()
          .execute();

        const variantOptionsRelations: NewProductVariantOptionRelation[] =
          input.variants.flatMap((variant, index) =>
            variant.option_values.map((option, index) => ({
              variant_id: createdVariants[index]?.id!,
              option_value_id: optionValues.find(
                (ov) =>
                  ov.value === option.value &&
                  ov.option_id ===
                    options.find((o) => o.title === option.title)?.id,
              )?.id!,
            })),
          );

        if (variantOptionsRelations.length > 0) {
          await trx
            .insertInto("product_variant_option_relations")
            .values(variantOptionsRelations)
            .execute();
        }

        for (const variantInput of input.variants) {
          const createdVariant = createdVariants.find(
            (v) => v.title === variantInput.title,
          );
          if (!createdVariant) {
            continue;
          }
          await this.attachMediaToOwner(trx, {
            ownerType: "product_variant",
            ownerId: createdVariant.id,
            mediaIds: variantInput.media_ids,
            thumbnailMediaId: variantInput.thumbnail_media_id,
            updateThumbnailTable: "product_variants",
          });
        }

        const variantMap = new Map<string, (typeof createdVariants)[0]>();
        for (const variant of createdVariants) {
          variantMap.set(variant.title, variant);
        }

        const priceSets = await trx
          .insertInto("price_sets")
          .values(
            createdVariants.map((v) => ({
              id: randomUUID(),
              variant_id: v.id,
              metadata: null,
            })),
          )
          .returningAll()
          .execute();

        const priceSetsMap = new Map<string, PriceSet>(
          priceSets.map((ps) => [ps.variant_id, ps]),
        );

        const inputPriceMap = new Map<
          string,
          Static<typeof ProductVariantPriceSchema>[]
        >(
          input.variants.map((v) => [
            createdVariants.find((cv) => cv.title === v.title)?.id ?? "",
            v.prices ?? [],
          ]),
        );
        const pricesToCreate = createdVariants
          .flatMap(
            (variant) =>
              inputPriceMap.get(variant.id)?.map((price) => ({
                id: randomUUID(),
                price_set_id: priceSetsMap.get(variant.id)?.id ?? "",
                amount: price.amount.toString(),
                currency_code: price.currency_code,
                min_quantity: price.min_quantity ?? null,
                max_quantity: price.max_quantity ?? null,
                price_list_id: price.price_list_id ?? null,
                metadata: null,
              })) ?? [],
          )
          .filter((price) => Boolean(price));

        if (pricesToCreate.length > 0) {
          await trx
            .insertInto("prices")
            .values(pricesToCreate)
            .returningAll()
            .execute();
        }
      }

      // ── Associate with sales channels ──────────────────────────────────
      if (input.sales_channel_ids && input.sales_channel_ids.length > 0) {
        const scRelations = input.sales_channel_ids.map((id) => ({
          id: randomUUID(),
          product_id: product.id,
          sales_channel_id: id,
        }));

        await trx
          .insertInto("product_sales_channels")
          .values(scRelations)
          .onConflict((oc) => oc.doNothing())
          .execute();
      }

      // ── Associate with shipping profile (stored in product metadata) ───
      if (input.shipping_profile_id) {
        const currentProduct = await trx
          .selectFrom("products")
          .where("id", "=", product.id)
          .selectAll()
          .executeTakeFirst();

        if (currentProduct) {
          const metadata =
            (currentProduct.metadata as Record<string, unknown>) || {};
          metadata.shipping_profile_id = input.shipping_profile_id;

          await trx
            .updateTable("products")
            .set({ metadata })
            .where("id", "=", product.id)
            .execute();
        }
      }

      // ── Link product to tags ───────────────────────────────────────────
      if (input.tag_ids && input.tag_ids.length > 0) {
        await trx
          .insertInto("product_tag_relations")
          .values(
            input.tag_ids.map((product_tag_id) => ({
              product_id: product.id,
              product_tag_id,
            })),
          )
          .onConflict((oc) => oc.doNothing())
          .execute();
      }

      // ── Link product to collections ───────────────────────────────────────────
      if (input.collection_ids && input.collection_ids.length > 0) {
        await trx
          .insertInto("product_collection_relations")
          .values(
            input.collection_ids.map((product_collection_id) => ({
              product_id: product.id,
              product_collection_id,
            })),
          )
          .onConflict((oc) => oc.doNothing())
          .execute();
      }
      if (input.attributes && input.attributes.length > 0) {
        await trx
          .insertInto("product_attribute_values")
          .values(
            input.attributes.map((attribute) => ({
              id: randomUUID(),
              value: attribute.value,
              attribute_id: attribute.attribute_id,
              product_id: product.id,
              metadata: null,
            })),
          )
          .onConflict((oc) => oc.doNothing())
          .execute();
      }

      await sql`commit`.execute(trx);
    } catch (error) {
      try {
        await sql`rollback`.execute(trx);
      } catch {
        // Ignore rollback errors and preserve original failure.
      }
      throw error;
    }

    return { id: createdProductId };
  }

  private async attachMediaToOwner(
    trx: Kysely<Database>,
    options: {
      ownerType: string;
      ownerId: string;
      mediaIds?: string[];
      thumbnailMediaId?: string;
      updateThumbnailTable?: "products" | "product_variants";
    },
  ) {
    const mediaTable = trx as any;
    const ids = new Set<string>(options.mediaIds ?? []);
    if (options.thumbnailMediaId) {
      ids.add(options.thumbnailMediaId);
    }
    if (ids.size === 0) {
      return;
    }

    await mediaTable
      .updateTable("media_files")
      .set({
        owner_type: options.ownerType,
        owner_id: options.ownerId,
      })
      .where("id", "in", [...ids])
      .where("deleted_at", "is", null)
      .execute();

    if (!options.thumbnailMediaId || !options.updateThumbnailTable) {
      return;
    }

    const thumbnailMedia = await mediaTable
      .selectFrom("media_files")
      .where("id", "=", options.thumbnailMediaId)
      .where("deleted_at", "is", null)
      .select(["url"])
      .executeTakeFirst();

    if (!thumbnailMedia) {
      return;
    }

    await mediaTable
      .updateTable(options.updateThumbnailTable)
      .set({ thumbnail: thumbnailMedia.url })
      .where("id", "=", options.ownerId)
      .where("deleted_at", "is", null)
      .execute();
  }
}
