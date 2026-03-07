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
  type PaginatedProductsProcessOutput,
  PaginatedProductsSchema,
} from "./paginated-products.schema";
import type { Database } from "../../../db/type";
import { paginationResponse } from "@danimai/core/pagination";

export const PAGINATED_PRODUCTS_PROCESS = Symbol("PaginatedProducts");

@Process(PAGINATED_PRODUCTS_PROCESS)
export class PaginatedProductsProcess implements ProcessContract<
  typeof PaginatedProductsSchema,
  PaginatedProductsProcessOutput
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) {}

  async runOperations(
    @ProcessContext({
      schema: PaginatedProductsSchema,
    })
    context: ProcessContextType<typeof PaginatedProductsSchema>,
  ): Promise<PaginatedProductsProcessOutput> {
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
      query = query.innerJoin("product_sales_channels",(join) => join.onRef("product_sales_channels.product_id", "=", "products.id").on("product_sales_channels.sales_channel_id", "in", sales_channel_ids));
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
      return  paginationResponse([], total, input);
    }

    const products = await (this.db as any)
      .selectFrom("products")
      .where("products.id", "in", productIds)
      .leftJoin("product_variants", (join: any) =>
        join
          .onRef("product_variants.product_id", "=", "products.id")
          .on("product_variants.deleted_at", "is", null),
      )
      .leftJoin("product_categories", (join: any) =>
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
      .select([
        "products.id as id",
        "products.title as title",
        "products.status as status",
        "products.handle as handle",
        (eb) => sql<number>`count(product_variants.id)::int`.as("variant_count"),
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
      ]).groupBy(["products.id", "products.title", "products.status", "products.handle", "product_categories.id"])
      .execute();


    return paginationResponse(products, total, input);
  }
}
