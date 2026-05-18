import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql, type OrderByExpression } from "kysely";
import {
  type StorefrontPaginatedProductsProcessOutput,
  StorefrontPaginatedProductsSchema,
} from "./storefront-paginated-products.schema";
import type { Database } from "../../../db/type";
import { paginationResponse } from "@danimai/core/pagination";

export const STOREFRONT_PAGINATED_PRODUCTS_PROCESS = Symbol("StorefrontPaginatedProducts");

@Process(STOREFRONT_PAGINATED_PRODUCTS_PROCESS)
export class StorefrontPaginatedProductsProcess implements ProcessContract<
  typeof StorefrontPaginatedProductsSchema,
  StorefrontPaginatedProductsProcessOutput
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  /**
   * Executes the storefront paginated products query.
   * Input: pagination, sorting, search, and optional filters.
   * Output: paginated storefront product rows.
   */
  async runOperations(
    @ProcessContext({
      schema: StorefrontPaginatedProductsSchema,
    })
    context: ProcessContextType<typeof StorefrontPaginatedProductsSchema>,
  ): Promise<StorefrontPaginatedProductsProcessOutput> {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
      search,
      filters,
    } = input;
    const {
      status,
      category_ids,
      tag_ids,
      sales_channel_ids,
      collection_ids,
    } = filters ?? {};

    let query = this.db.selectFrom("products").where("deleted_at", "is", null);

    if (status) {
      query = query.where("status", "=", status);
    }

    if (category_ids && category_ids.length > 0) {
      query = query.where("products.category_id", "in", category_ids);
    }

    if (tag_ids && tag_ids.length > 0) {
      query = query.innerJoin(
        "product_tag_relations",
        (join) => join
          .onRef("product_tag_relations.product_id", "=", "products.id")
          .on("product_tag_relations.product_tag_id", "in", tag_ids),
      );
    }

    if (collection_ids && collection_ids.length > 0) {
      query = query.innerJoin(
        "product_collection_relations",
        (join) => join
          .onRef("product_collection_relations.product_id", "=", "products.id")
          .on("product_collection_relations.product_collection_id", "in", collection_ids)
      );
    }

    if (sales_channel_ids && sales_channel_ids.length > 0) {
      query = query.innerJoin(
        "product_sales_channels",
        (join) => join
          .onRef("product_sales_channels.product_id", "=", "products.id")
          .on("product_sales_channels.sales_channel_id", "in", sales_channel_ids)
      );
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb("title", "ilike", searchTerm),
          eb("handle", "ilike", searchTerm),
        ]),
      );
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);
    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";

    query = query.orderBy(sorting_field as OrderByExpression<Database, "products", {}>, sortOrder);

    const offset = (Number(page) - 1) * Number(limit);
    const rows = await query.selectAll().limit(limit).offset(offset).execute();

    const productIds = rows.map((p) => p.id);
    if (productIds.length === 0) {
      return paginationResponse([], total, input);
    }

    const products = await this.db
      .selectFrom("products")
      .where("products.id", "in", productIds)
      .leftJoin("product_variants", (join) =>
        join
          .onRef("product_variants.product_id", "=", "products.id")
          .on("product_variants.deleted_at", "is", null),
      )
      .leftJoin("product_categories", (join) =>
        join
          .onRef("product_categories.id", "=", "products.category_id")
          .on("product_categories.deleted_at", "is", null),
      )
      .leftJoin(
        "product_sales_channels",
        "product_sales_channels.product_id",
        "products.id",
      )
      .leftJoin("sales_channels", (join) =>
        join
          .onRef("sales_channels.id", "=", "product_sales_channels.sales_channel_id")
          .on("sales_channels.deleted_at", "is", null),
      )
      .leftJoin("product_option_values", (join) =>
        join
          .onRef("product_option_values.product_id", "=", "products.id")
          .on("product_option_values.deleted_at", "is", null),
      )
      .leftJoin("product_options", (join) =>
        join
          .onRef("product_options.id", "=", "product_option_values.option_id")
          .on("product_options.deleted_at", "is", null),
      )
      .leftJoin("product_images as product_level_images", (join) =>
        join
          .onRef("product_level_images.product_id", "=", "products.id")
          .on("product_level_images.deleted_at", "is", null)
          .on("product_level_images.variant_id", "is", null),
      )
      .select([
        "products.id as id",
        "products.title as title",
        "products.status as status",
        "products.handle as handle",
        "products.thumbnail as product_thumbnail",
        (eb) => sql<string | null>`
          (
            array_agg(product_level_images.url order by product_level_images.rank asc)
            FILTER (WHERE product_level_images.url IS NOT NULL)
          )[1]
        `.as("product_level_thumbnail"),
        (eb) => sql<number>`count(distinct product_variants.id)::int`.as("variant_count"),
        (eb) => sql<{
          id: string;
          name: string;
        }[]>`
          CASE
            WHEN count(sales_channels.id) = 0 THEN ARRAY[]::json[]
            ELSE  array_agg(
              DISTINCT jsonb_build_object(
                'id', sales_channels.id,
                'name', sales_channels.name
              )
            )::json[]
          END
        `.as("sales_channels"),
        (eb) => sql<{ id: string; value: string; } | null>`
          CASE
            WHEN product_categories.id IS NULL THEN NULL
            ELSE jsonb_build_object(
              'id', product_categories.id,
              'value', product_categories.value
            )
          END
        `.as('category'),
        (eb) => sql<{
          id: string;
          value: string;
          rank: number;
          option: {
            id: string;
            title: string;
          };
        }[]>`
          CASE
            WHEN count(product_option_values.id) = 0 THEN ARRAY[]::json[]
            ELSE array_agg(
              DISTINCT jsonb_build_object(
                'id', product_option_values.id,
                'value', product_option_values.value,
                'rank', product_option_values.rank,
                'option', jsonb_build_object(
                  'id', product_options.id,
                  'title', product_options.title
                )
              )
            )::json[]
          END
        `.as("option_values"),
      ]).groupBy([
        "products.id",
        "products.title",
        "products.status",
        "products.handle",
        "products.thumbnail",
        "product_categories.id",
      ])
      .execute();

    const variants = await this.db
      .selectFrom("product_variants")
      .leftJoin("product_images as variant_images", (join) =>
        join
          .onRef("variant_images.variant_id", "=", "product_variants.id")
          .on("variant_images.deleted_at", "is", null),
      )
      .leftJoin("price_sets", "price_sets.variant_id", "product_variants.id")
      .leftJoin("prices", (join) =>
        join
          .onRef("prices.price_set_id", "=", "price_sets.id")
          .on("prices.deleted_at", "is", null),
      )
      .distinctOn(["product_variants.product_id"])
      .where("product_variants.product_id", "in", productIds)
      .where("product_variants.deleted_at", "is", null)
      .select([
        "product_variants.id as id",
        "product_variants.product_id as product_id",
        "product_variants.title as title",
        "product_variants.sku as sku",
        "product_variants.thumbnail as thumbnail",
        "product_variants.variant_rank as variant_rank",
        "variant_images.url as variant_image_url",
        "prices.amount as amount",
        "prices.currency_code as currency_code",
        "prices.min_quantity as min_quantity",
        "prices.max_quantity as max_quantity",
        "prices.price_list_id as price_list_id",
      ])
      .orderBy("product_variants.product_id", "asc")
      .orderBy(sql`product_variants.variant_rank asc nulls last`)
      .orderBy("prices.id", "asc")
      .orderBy(sql`variant_images.rank asc nulls last`)
      .execute();

    const variantsByProduct = new Map<string, StorefrontPaginatedProductsProcessOutput["rows"][number]["variant"]>();
    for (const row of variants) {
      variantsByProduct.set(row.product_id, {
        id: row.id,
        title: row.title,
        sku: row.sku,
        thumbnail: row.thumbnail ?? row.variant_image_url,
        variant_rank: row.variant_rank,
        price: row.amount !== null && row.currency_code !== null
          ? {
            amount: row.amount,
            currency_code: row.currency_code,
            min_quantity: row.min_quantity,
            max_quantity: row.max_quantity,
            price_list_id: row.price_list_id,
          }
          : null,
      });
    }

    type ProductAggRow = (typeof products)[number] & {
      product_thumbnail: string | null;
      product_level_thumbnail: string | null;
      option_values: StorefrontPaginatedProductsProcessOutput["rows"][number]["option_values"];
    };

    const productsWithVariants = products.map((row) => {
      const { product_thumbnail, product_level_thumbnail, ...productBase } = row as ProductAggRow;
      const variant = variantsByProduct.get(row.id) ?? null;
      const productThumb =
        product_thumbnail ??
        product_level_thumbnail ??
        null;
      const thumbnail = (variant?.thumbnail ?? null) ?? productThumb ?? null;
      const variantOut = variant
        ? {
            ...variant,
            thumbnail: variant.thumbnail ?? productThumb,
          }
        : null;
      return {
        ...productBase,
        thumbnail,
        option_values: productBase.option_values,
        variant: variantOut,
      };
    });

    return paginationResponse(productsWithVariants, total, input);
  }
}
