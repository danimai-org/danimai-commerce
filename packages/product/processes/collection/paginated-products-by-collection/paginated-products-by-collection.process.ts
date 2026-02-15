import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  SortOrder,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type PaginatedProductsByCollectionProcessInput,
  PaginatedProductsByCollectionSchema,
} from "./paginated-products-by-collection.schema";
import type { Database, ProductCollection } from "../../../db/type";
import type { PaginatedProductItem, PaginatedProductsResponse } from "../../product/paginated-products/paginated-products.process";

export const PAGINATED_PRODUCTS_BY_COLLECTION_PROCESS = Symbol(
  "PaginatedProductsByCollection"
);

@Process(PAGINATED_PRODUCTS_BY_COLLECTION_PROCESS)
export class PaginatedProductsByCollectionProcess
  implements ProcessContract<PaginatedProductsResponse> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedProductsByCollectionSchema })
    context: ProcessContextType<typeof PaginatedProductsByCollectionSchema>
  ) {
    const { input } = context;
    const {
      collection_id,
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    const collection = await this.db
      .selectFrom("product_collections")
      .where("id", "=", collection_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!collection) {
      throw new ValidationError("Collection not found", [
        {
          type: "not_found",
          message: "Collection not found",
          path: "collection_id",
        },
      ]);
    }

    const relationRows = await this.db
      .selectFrom("product_collection_relations")
      .where("product_collection_id", "=", collection_id)
      .select("product_id")
      .execute();

    const productIds = relationRows.map((r) => r.product_id);
    if (productIds.length === 0) {
      const offset = (page - 1) * limit;
      return { products: [], count: 0, offset, limit };
    }

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "title",
      "handle",
      "status",
      "category_id",
      "is_giftcard",
      "discountable",
      "created_at",
      "updated_at",
      "deleted_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";

    const countResult = await this.db
      .selectFrom("products")
      .where("id", "in", productIds)
      .where("deleted_at", "is", null)
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);
    const offset = (page - 1) * limit;

    const rows = await this.db
      .selectFrom("products")
      .where("id", "in", productIds)
      .where("deleted_at", "is", null)
      .selectAll()
      .orderBy(sql.ref(`products.${safeSortField}`), sortOrder)
      .limit(limit)
      .offset(offset)
      .execute();

    const rowIds = rows.map((p) => p.id);
    if (rowIds.length === 0) {
      return { products: [], count: total, offset, limit };
    }

    const variants = await this.db
      .selectFrom("product_variants")
      .where("product_id", "in", rowIds)
      .where("deleted_at", "is", null)
      .select(["id", "product_id"])
      .execute();

    const collectionForProduct: ProductCollection = {
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      metadata: collection.metadata,
      created_at: collection.created_at,
      updated_at: collection.updated_at,
      deleted_at: collection.deleted_at,
    };

    const variantsByProduct = new Map<string, Array<{ id: string }>>();
    for (const v of variants) {
      if (!v.product_id) continue;
      const list = variantsByProduct.get(v.product_id) ?? [];
      list.push({ id: v.id });
      variantsByProduct.set(v.product_id, list);
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
        collection: collectionForProduct,
        sales_channel_ids: salesChannelIds,
      };
    });

    return { products, count: total, offset, limit };
  }
}
