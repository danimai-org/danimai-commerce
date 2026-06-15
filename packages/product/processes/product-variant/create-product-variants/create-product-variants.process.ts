import {
  InjectDB,
  InjectLogger,
  InternalServerError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import { randomUUID } from "crypto";
import {
  CreateProductVariantsSchema,
  type CreateProductVariantsProcessInput,
  type CreateProductVariantsProcessOutput,
} from "./create-product-variants.schema";
import type {
  Database,
  NewProductVariantOptionRelation,
  ProductOption,
  ProductOptionValue,
} from "../../../db/type";
import type { PriceSet } from "@danimai/pricing";

/**
 * Handles the create (replace) product variants process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_PRODUCT_VARIANTS_PROCESS = Symbol("CreateProductVariants");

/**
 * Replaces all variants of a product with the supplied set.
 * Existing variants, their option-value relations, image relations, price sets,
 * prices, and the product's option values are removed first; then options,
 * option values, variants, option-value relations, price sets and prices are
 * created from the new payload.
 * Input: { product_id, options, variants[] } payload.
 * Output: { product_id, variant_ids } of the freshly created variants.
 */
@Process(CREATE_PRODUCT_VARIANTS_PROCESS)
export class CreateProductVariantsProcess implements ProcessContract<
  typeof CreateProductVariantsSchema,
  CreateProductVariantsProcessOutput
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
   * Output: { product_id, variant_ids } for the newly created variants.
   */
  async runOperations(
    @ProcessContext({
      schema: CreateProductVariantsSchema,
    })
    context: ProcessContextType<typeof CreateProductVariantsSchema>,
  ) {
    const { input } = context;

    const trx = this.db;

    await sql`begin`.execute(trx);

    let createdVariantIds: string[] = [];

    try {
      // Validate that the product exists and is not soft-deleted.
      const product = await trx
        .selectFrom("products")
        .where("id", "=", input.product_id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (!product) {
        throw new ValidationError("Product not found", [
          {
            type: "not_found",
            message: "Product not found",
            path: "product_id",
          },
        ]);
      }

      // Replace semantics: remove current variants and option values for this product
      // before inserting the new set (avoids duplicate variant rows on each save).
      const existingVariants = await trx
        .selectFrom("product_variants")
        .where("product_id", "=", input.product_id)
        .where("deleted_at", "is", null)
        .select("id")
        .execute();

      const existingVariantIds = existingVariants.map((row) => row.id);
      if (existingVariantIds.length > 0) {
        // price_sets / prices live in pricing schema; trx is widened like attachMediaToOwner below.
        const pricingDb = trx as any;

        const existingPriceSets = await pricingDb
          .selectFrom("price_sets")
          .where("variant_id", "in", existingVariantIds)
          .select("id")
          .execute();

        const existingPriceSetIds = (existingPriceSets as { id: string }[]).map(
          (ps) => ps.id,
        );

        if (existingPriceSetIds.length > 0) {
          await pricingDb
            .deleteFrom("prices")
            .where("price_set_id", "in", existingPriceSetIds)
            .execute();

          await pricingDb
            .deleteFrom("price_sets")
            .where("id", "in", existingPriceSetIds)
            .execute();
        }

        await trx
          .deleteFrom("product_variants")
          .where("id", "in", existingVariantIds)
          .execute();
      }

      await trx
        .deleteFrom("product_option_values")
        .where("product_id", "=", input.product_id)
        .execute();

      // Reuse existing global product_options by title (case-insensitive),
      // create rows for any titles that don't yet exist, then insert
      // per-product product_option_values keyed by (option_id, product_id).
      let options: ProductOption[] = [];
      let optionValues: ProductOptionValue[] = [];

      if (input.options.length > 0) {
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
          (o) =>
            !existingOptions.some(
              (eo) => eo.title.toLowerCase() === o.title.toLowerCase(),
            ),
        );

        let newlyCreatedOptions: ProductOption[] = [];
        if (optionsToCreate.length > 0) {
          newlyCreatedOptions = await trx
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

        options = [...existingOptions, ...newlyCreatedOptions];

        const optionValueRows = input.options.flatMap((o, optionRank) => {
          const optionId = options.find(
            (option) => option.title.toLowerCase() === o.title.toLowerCase(),
          )?.id;
          if (!optionId) {
            return [];
          }
          return o.values.map((value, valueRank) => ({
            id: randomUUID(),
            value,
            option_id: optionId,
            product_id: input.product_id,
            rank: optionRank * 1000 + valueRank,
          }));
        });

        if (optionValueRows.length > 0) {
          optionValues = await trx
            .insertInto("product_option_values")
            .values(optionValueRows)
            .returningAll()
            .execute();
        }
      }

      // Create variants.
      if (input.variants.length === 0) {
        await sql`commit`.execute(trx);
        return { product_id: input.product_id, variant_ids: [] };
      }

      const variantsToCreate = input.variants.map((variantInput) => ({
        id: randomUUID(),
        title: variantInput.title,
        product_id: input.product_id,
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

      if (createdVariants.length !== input.variants.length) {
        throw new InternalServerError("Failed to create product variants");
      }

      await this.ensureManagedVariantInventoryItems(trx as any, createdVariants);

      createdVariantIds = createdVariants.map((v) => v.id);

      // Build option-value relations by resolving each variant's
      // (option title, value) pair to the matching option_value id.
      const variantOptionsRelations: NewProductVariantOptionRelation[] =
        input.variants.flatMap((variant, index) => {
          const variantId = createdVariants[index]?.id;
          if (!variantId) {
            return [];
          }
          return variant.option_values
            .map((ov) => {
              const optionId = options.find(
                (o) => o.title.toLowerCase() === ov.title.toLowerCase(),
              )?.id;
              if (!optionId) {
                return null;
              }
              const optionValueId = optionValues.find(
                (val) => val.option_id === optionId && val.value === ov.value,
              )?.id;
              if (!optionValueId) {
                return null;
              }
              return {
                variant_id: variantId,
                option_value_id: optionValueId,
              } satisfies NewProductVariantOptionRelation;
            })
            .filter((r): r is NewProductVariantOptionRelation => r !== null);
        });

      if (variantOptionsRelations.length > 0) {
        await trx
          .insertInto("product_variant_option_relations")
          .values(variantOptionsRelations)
          .execute();
      }

      // Attach media for each variant (matches create-product behaviour).
      for (const [index, variantInput] of input.variants.entries()) {
        const createdVariant = createdVariants[index];
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

      // Create one price_set per variant, then insert all prices in a single
      // statement to avoid N+1 inserts.
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

      const priceSetByVariantId = new Map<string, PriceSet>(
        priceSets.map((ps) => [ps.variant_id, ps]),
      );

      const pricesToCreate = createdVariants.flatMap((variant, index) => {
        const inputPrices = input.variants[index]?.prices ?? [];
        const priceSetId = priceSetByVariantId.get(variant.id)?.id;
        if (!priceSetId) {
          return [];
        }
        return inputPrices.map((price) => ({
          id: randomUUID(),
          price_set_id: priceSetId,
          amount: price.amount.toString(),
          currency_code: price.currency_code,
          min_quantity: price.min_quantity ?? null,
          max_quantity: price.max_quantity ?? null,
          price_list_id: price.price_list_id ?? null,
          metadata: null,
        }));
      });

      if (pricesToCreate.length > 0) {
        await trx.insertInto("prices").values(pricesToCreate).execute();
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

    return { product_id: input.product_id, variant_ids: createdVariantIds };
  }

  // Mirrors the helper in create-product.process.ts; updates media_files
  // ownership and refreshes the variant thumbnail when a thumbnail media id
  // is supplied.
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

  private async ensureManagedVariantInventoryItems(
    trx: any,
    variants: Array<{ sku: string | null; manage_inventory: boolean; metadata: unknown | null }>
  ) {
    const managedSkus = Array.from(
      new Set(
        variants
          .filter((variant) => variant.manage_inventory && typeof variant.sku === "string" && variant.sku.trim() !== "")
          .map((variant) => String(variant.sku).trim())
      )
    );

    if (managedSkus.length === 0) {
      return;
    }

    const existingInventory = await trx
      .selectFrom("inventory_items")
      .where("sku", "in", managedSkus)
      .where("deleted_at", "is", null)
      .select(["sku"])
      .execute();

    const existingSkuSet = new Set(
      (existingInventory as Array<{ sku: string | null }>)
        .map((row) => row.sku)
        .filter((sku): sku is string => typeof sku === "string")
    );

    const rowsToCreate = managedSkus
      .filter((sku) => !existingSkuSet.has(sku))
      .map((sku) => ({
        id: randomUUID(),
        sku,
        requires_shipping: true,
        metadata: null,
      }));

    if (rowsToCreate.length === 0) {
      return;
    }

    await trx
      .insertInto("inventory_items")
      .values(rowsToCreate)
      .execute();
  }
}
