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
  type PaginatedProductsByAttributeProcessInput,
  PaginatedProductsByAttributeSchema,
} from "./paginated-products-by-attribute.schema";
import type { Database, Product } from "../../../db/type";

export type ProductByAttributeItem = Product & {
  collection: { id: string; title: string; handle: string } | null;
  variants: Array<{ id: string }>;
};

export const PAGINATED_PRODUCTS_BY_ATTRIBUTE_PROCESS = Symbol(
  "PaginatedProductsByAttribute",
);

@Process(PAGINATED_PRODUCTS_BY_ATTRIBUTE_PROCESS)
export class PaginatedProductsByAttributeProcess
  implements ProcessContract<PaginationResponseType<ProductByAttributeItem>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) { }

  async runOperations(
    @ProcessContext({
      schema: PaginatedProductsByAttributeSchema,
    })
    context: ProcessContextType<typeof PaginatedProductsByAttributeSchema>,
  ) {
    const { input } = context;
    const {
      attribute_id,
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    const attribute = await this.db
      .selectFrom("product_attributes")
      .where("id", "=", attribute_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!attribute) {
      throw new ValidationError("Product attribute not found", [
        {
          type: "not_found",
          message: "Product attribute not found",
          path: "attribute_id",
        },
      ]);
    }

    const productIdsRows = await this.db
      .selectFrom("product_attribute_values")
      .innerJoin(
        "product_attribute_group_attributes",
        (join) =>
          join
            .onRef("product_attribute_group_attributes.attribute_group_id", "=", "product_attribute_values.attribute_group_id")
            .onRef("product_attribute_group_attributes.attribute_id", "=", "product_attribute_values.attribute_id")
      )
      .innerJoin("products", "products.id", "product_attribute_values.product_id")
      .where("product_attribute_values.attribute_id", "=", attribute_id)
      .where("product_attribute_values.product_id", "is not", null)
      .where(
        sql`(
          EXISTS (
            SELECT 1 FROM product_attribute_group_relations pagr
            WHERE pagr.product_id = product_attribute_values.product_id
              AND pagr.attribute_group_id = product_attribute_values.attribute_group_id
          )
          OR products.attribute_group_id = product_attribute_values.attribute_group_id
        )`
      )
      .select("product_attribute_values.product_id")
      .execute();

    const ids = productIdsRows
      .map((r) => r.product_id)
      .filter((id): id is string => !!id);

    if (ids.length === 0) {
      return paginationResponse<ProductByAttributeItem>([], 0, input);
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
        "product_collection_relations.product_collection_id",
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

    const data: ProductByAttributeItem[] = rows.map((p) => ({
      ...p,
      collection: collectionByProduct.get(p.id) ?? null,
      variants: variantsByProduct.get(p.id) ?? [],
    }));

    return paginationResponse<ProductByAttributeItem>(data, total, input);
  }
}
