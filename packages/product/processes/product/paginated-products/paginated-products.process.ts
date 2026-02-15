import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type PaginatedProductsProcessInput, PaginatedProductsSchema } from "./paginated-products.schema";
import type { Database, Product, ProductCollection } from "../../../db/type";

export type PaginatedProductItem = {
  id: string;
  title: string;
  handle: string;
  status: string;
  thumbnail: string | null;
  variants: Array<{ id: string }>;
  collection: {
    id: string;
    title: string;
    handle: string;
    metadata: unknown | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  } | null;
  sales_channel_ids: string[];
};

export type PaginatedProductsResponse = {
  products: PaginatedProductItem[];
  count: number;
  offset: number;
  limit: number;
};

export const PAGINATED_PRODUCTS_PROCESS = Symbol("PaginatedProducts");

@Process(PAGINATED_PRODUCTS_PROCESS)
export class PaginatedProductsProcess
  implements ProcessContract<PaginatedProductsResponse> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedProductsSchema,
  }) context: ProcessContextType<typeof PaginatedProductsSchema>) {
    const { input } = context;
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC, category_id } = input;

    let query = this.db
      .selectFrom("products")
      .where("deleted_at", "is", null);

    if (category_id) {
      query = query.where("category_id", "=", category_id);
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);
    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = ["id", "title", "handle", "status", "category_id", "is_giftcard", "discountable", "created_at", "updated_at", "deleted_at"];
    const safeSortField = allowedSortFields.includes(sorting_field) ? sorting_field : "created_at";
    query = query.orderBy(sql.ref(`products.${safeSortField}`), sortOrder);

    const offset = (page - 1) * limit;
    const rows = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    const productIds = rows.map((p) => p.id);
    if (productIds.length === 0) {
      return { products: [], count: total, offset, limit };
    }

    const variants = await this.db
      .selectFrom("product_variants")
      .where("product_id", "in", productIds)
      .where("deleted_at", "is", null)
      .select(["id", "product_id"])
      .execute();

    const relations = await this.db
      .selectFrom("product_collection_relations")
      .innerJoin("product_collections", "product_collections.id", "product_collection_relations.product_collection_id")
      .where("product_collection_relations.product_id", "in", productIds)
      .where("product_collections.deleted_at", "is", null)
      .select([
        "product_collection_relations.product_id",
        "product_collections.id as collection_id",
        "product_collections.title as collection_title",
        "product_collections.handle as collection_handle",
        "product_collections.metadata as collection_metadata",
        "product_collections.created_at as collection_created_at",
        "product_collections.updated_at as collection_updated_at",
        "product_collections.deleted_at as collection_deleted_at",
      ])
      .execute();

    const variantsByProduct = new Map<string, Array<{ id: string }>>();
    for (const v of variants) {
      if (!v.product_id) continue;
      const list = variantsByProduct.get(v.product_id) ?? [];
      list.push({ id: v.id });
      variantsByProduct.set(v.product_id, list);
    }

    const collectionByProduct = new Map<string, ProductCollection>();
    for (const r of relations) {
      if (collectionByProduct.has(r.product_id)) continue;
      collectionByProduct.set(r.product_id, {
        id: r.collection_id,
        title: r.collection_title,
        handle: r.collection_handle,
        metadata: r.collection_metadata,
        created_at: r.collection_created_at,
        updated_at: r.collection_updated_at,
        deleted_at: r.collection_deleted_at,
      } as ProductCollection);
    }

    const products: PaginatedProductItem[] = rows.map((p) => {
      const metadata = (p.metadata as Record<string, unknown> | null) ?? {};
      const salesChannelIds = (metadata.sales_channels as string[] | undefined) ?? [];
      return {
        id: p.id,
        title: p.title,
        handle: p.handle,
        status: p.status,
        thumbnail: p.thumbnail,
        variants: variantsByProduct.get(p.id) ?? [],
        collection: collectionByProduct.get(p.id) ?? null,
        sales_channel_ids: salesChannelIds,
      };
    });

    return { products, count: total, offset, limit };
  }
}
