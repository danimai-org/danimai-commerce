import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  type PaginationResponseType,
  paginationResponse,
  SortOrder,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type PaginatedProductsByTagProcessInput,
  PaginatedProductsByTagSchema,
} from "./paginated-products-by-tag.schema";
import type { Database, Product } from "../../../db/type";

export type ProductByTagItem = Product & {
  collection: { id: string; title: string; handle: string } | null;
  variants: Array<{ id: string }>;
};

export const PAGINATED_PRODUCTS_BY_TAG_PROCESS = Symbol(
  "PaginatedProductsByTag"
);

@Process(PAGINATED_PRODUCTS_BY_TAG_PROCESS)
export class PaginatedProductsByTagProcess
  implements ProcessContract<PaginationResponseType<ProductByTagItem>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({
      schema: PaginatedProductsByTagSchema,
    })
    context: ProcessContextType<typeof PaginatedProductsByTagSchema>
  ) {
    const { input } = context;
    const {
      tag_id,
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    const tag = await this.db
      .selectFrom("product_tags")
      .where("id", "=", tag_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!tag) {
      throw new ValidationError("Product tag not found", [
        {
          type: "not_found",
          message: "Product tag not found",
          path: "tag_id",
        },
      ]);
    }

    const productIds = await this.db
      .selectFrom("product_tag_relations")
      .where("product_tag_id", "=", tag_id)
      .select("product_id")
      .execute();

    const ids = productIds.map((r) => r.product_id);
    if (ids.length === 0) {
      return paginationResponse<ProductByTagItem>([], 0, input);
    }

    const sortOrder =
      sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "title",
      "handle",
      "status",
      "category_id",
      "created_at",
      "updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";

    const countResult = await this.db
      .selectFrom("products")
      .where("id", "in", ids)
      .where("deleted_at", "is", null)
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);
    const offset = (page - 1) * limit;
    const rows = await this.db
      .selectFrom("products")
      .where("id", "in", ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .orderBy(sql.ref(`products.${safeSortField}`), sortOrder)
      .limit(limit)
      .offset(offset)
      .execute();

    const pageProductIds = rows.map((p) => p.id);

    const variants = await this.db
      .selectFrom("product_variants")
      .where("product_id", "in", pageProductIds)
      .where("deleted_at", "is", null)
      .select(["id", "product_id"])
      .execute();

    const relations = await this.db
      .selectFrom("product_collection_relations")
      .innerJoin(
        "product_collections",
        "product_collections.id",
        "product_collection_relations.product_collection_id"
      )
      .where("product_collection_relations.product_id", "in", pageProductIds)
      .where("product_collections.deleted_at", "is", null)
      .select([
        "product_collection_relations.product_id",
        "product_collections.id as collection_id",
        "product_collections.title as collection_title",
        "product_collections.handle as collection_handle",
      ])
      .execute();

    const variantsByProduct = new Map<string, Array<{ id: string }>>();
    for (const v of variants) {
      if (!v.product_id) continue;
      const list = variantsByProduct.get(v.product_id) ?? [];
      list.push({ id: v.id });
      variantsByProduct.set(v.product_id, list);
    }

    const collectionByProduct = new Map<
      string,
      { id: string; title: string; handle: string }
    >();
    for (const r of relations) {
      if (collectionByProduct.has(r.product_id)) continue;
      collectionByProduct.set(r.product_id, {
        id: r.collection_id,
        title: r.collection_title,
        handle: r.collection_handle,
      });
    }

    const data: ProductByTagItem[] = rows.map((p) => ({
      ...p,
      collection: collectionByProduct.get(p.id) ?? null,
      variants: variantsByProduct.get(p.id) ?? [],
    }));

    return paginationResponse<ProductByTagItem>(data, total, input);
  }
}
