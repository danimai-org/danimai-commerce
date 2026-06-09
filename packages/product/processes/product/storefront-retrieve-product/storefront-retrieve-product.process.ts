import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Database } from "../../../db/type";
import {
  loadProductMedia,
  resolveProductThumbnail,
} from "../product-media.util";
import {
  type StorefrontRetrieveProductProcessOutput,
  StorefrontRetrieveProductSchema,
} from "./storefront-retrieve-product.schema";
import {
  compareVariantsBySkuPreference,
  productHasValidSkuVariant,
} from "../storefront-product-sku.util";

export const STOREFRONT_RETRIEVE_PRODUCT_PROCESS = Symbol(
  "StorefrontRetrieveProduct",
);

@Process(STOREFRONT_RETRIEVE_PRODUCT_PROCESS)
export class StorefrontRetrieveProductProcess implements ProcessContract<
  typeof StorefrontRetrieveProductSchema,
  StorefrontRetrieveProductProcessOutput
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) {}

  /**
   * Loads a storefront product by handle with ordered media and variant pricing.
   * Input: product handle (exact match).
   * Output: product detail payload for the PDP.
   */
  async runOperations(
    @ProcessContext({ schema: StorefrontRetrieveProductSchema })
    context: ProcessContextType<typeof StorefrontRetrieveProductSchema>,
  ): Promise<StorefrontRetrieveProductProcessOutput> {
    const handle = context.input.handle.trim();
    if (!handle) {
      throw new NotFoundError("Product not found");
    }

    const product = await this.db
      .selectFrom("products")
      .where("handle", "=", handle)
      .where("deleted_at", "is", null)
      .where((eb) => productHasValidSkuVariant(eb))
      .select(["id", "title", "handle", "thumbnail", "description"])
      .executeTakeFirst();

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const media = await loadProductMedia(this.db, product.id);
    const thumbnail = await resolveProductThumbnail(
      this.db,
      product.id,
      product.thumbnail,
      media,
    );

    const variants = await this.db
      .selectFrom("product_variants")
      .leftJoin("product_images as variant_images", (join) =>
        join
          .onRef("variant_images.variant_id", "=", "product_variants.id")
          .on("variant_images.deleted_at", "is", null),
      )
      .where("product_variants.product_id", "=", product.id)
      .where("product_variants.deleted_at", "is", null)
      .select([
        "product_variants.id as id",
        "product_variants.title as title",
        "product_variants.sku as sku",
        "product_variants.thumbnail as thumbnail",
        "product_variants.variant_rank as variant_rank",
        "variant_images.url as variant_image_url",
      ])
      .orderBy(sql`product_variants.variant_rank asc nulls last`)
      .orderBy("product_variants.created_at", "asc")
      .execute();

    const variantIds = variants.map((v) => v.id);
    const optionsByVariantId = new Map<
      string,
      Array<{ id: string; title: string; value: string; rank: number }>
    >();
    const pricesByVariantId = new Map<
      string,
      Array<{
        amount: string;
        currency_code: string;
        min_quantity: number | null;
        max_quantity: number | null;
        price_list_id: string | null;
      }>
    >();

    if (variantIds.length > 0) {
      const optionRows = await this.db
        .selectFrom("product_variant_option_relations")
        .innerJoin("product_option_values", (join) =>
          join
            .onRef(
              "product_option_values.id",
              "=",
              "product_variant_option_relations.option_value_id",
            )
            .on("product_option_values.deleted_at", "is", null),
        )
        .innerJoin("product_options", (join) =>
          join
            .onRef("product_options.id", "=", "product_option_values.option_id")
            .on("product_options.deleted_at", "is", null),
        )
        .where(
          "product_variant_option_relations.variant_id",
          "in",
          variantIds,
        )
        .select([
          "product_variant_option_relations.variant_id as variant_id",
          "product_option_values.id as id",
          "product_options.title as title",
          "product_option_values.value as value",
          "product_option_values.rank as rank",
        ])
        .orderBy("product_option_values.rank", "asc")
        .execute();

      for (const row of optionRows) {
        const existing = optionsByVariantId.get(row.variant_id) ?? [];
        existing.push({
          id: row.id,
          title: row.title,
          value: row.value,
          rank: row.rank,
        });
        optionsByVariantId.set(row.variant_id, existing);
      }

      const priceRows = await this.db
        .selectFrom("price_sets")
        .innerJoin("prices", (join) =>
          join
            .onRef("prices.price_set_id", "=", "price_sets.id")
            .on("prices.deleted_at", "is", null),
        )
        .where("price_sets.variant_id", "in", variantIds)
        .where("price_sets.deleted_at", "is", null)
        .select([
          "price_sets.variant_id as variant_id",
          "prices.amount as amount",
          "prices.currency_code as currency_code",
          "prices.min_quantity as min_quantity",
          "prices.max_quantity as max_quantity",
          "prices.price_list_id as price_list_id",
        ])
        .orderBy("prices.id", "asc")
        .execute();

      for (const row of priceRows) {
        if (row.variant_id == null || row.amount == null || row.currency_code == null) {
          continue;
        }
        const existing = pricesByVariantId.get(row.variant_id) ?? [];
        existing.push({
          amount: row.amount,
          currency_code: row.currency_code,
          min_quantity: row.min_quantity,
          max_quantity: row.max_quantity,
          price_list_id: row.price_list_id,
        });
        pricesByVariantId.set(row.variant_id, existing);
      }
    }

    const variantRows = variants
      .map((variant) => {
        const variantThumb = variant.thumbnail ?? variant.variant_image_url ?? thumbnail;
        return {
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          thumbnail: variantThumb,
          variant_rank: variant.variant_rank,
          options: optionsByVariantId.get(variant.id) ?? [],
          prices: pricesByVariantId.get(variant.id) ?? [],
        };
      })
      .sort(compareVariantsBySkuPreference);

    const defaultVariant = variantRows[0] ?? null;

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      thumbnail,
      description: product.description,
      media,
      variant: defaultVariant
        ? {
            id: defaultVariant.id,
            title: defaultVariant.title,
            sku: defaultVariant.sku,
            thumbnail: defaultVariant.thumbnail,
            variant_rank: defaultVariant.variant_rank,
            price: defaultVariant.prices[0] ?? null,
          }
        : null,
      variants: variantRows,
    };
  }
}
