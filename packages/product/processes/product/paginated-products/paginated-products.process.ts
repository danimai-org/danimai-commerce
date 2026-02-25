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
import {
  type PaginatedProductsProcessInput,
  PaginatedProductsSchema,
} from "./paginated-products.schema";
import type { Database, Product, ProductCategory } from "../../../db/type";

export type PaginatedProductItem = {
  id: string;
  title: string;
  handle: string;
  status: string;
  thumbnail: string | null;
  variants: Array<{ id: string }>;
  category_id: string | null;
  category: {
    id: string;
    value: string;
    handle: string;
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
export class PaginatedProductsProcess implements ProcessContract<PaginatedProductsResponse> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({
      schema: PaginatedProductsSchema,
    })
    context: ProcessContextType<typeof PaginatedProductsSchema>,
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
      category_id,
      category_ids,
      search,
      filters
    } = input;

    let query = this.db.selectFrom("products").where("deleted_at", "is", null);

    if (category_ids?.length) {
      query = query.where("category_id", "in", category_ids);
    } else if (category_id) {
      query = query.where("category_id", "=", category_id);
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
    query = query.orderBy(sql.ref(`products.${safeSortField}`), sortOrder);

    const offset = (page - 1) * limit;
    const rows = await query.selectAll().limit(limit).offset(offset).execute();

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

    const categoryIds = [
      ...new Set(rows.map((p) => p.category_id).filter(Boolean) as string[]),
    ];
    let categoryMap: Record<string, ProductCategory> = {};
    if (categoryIds.length > 0) {
      const categories = await this.db
        .selectFrom("product_categories")
        .where("id", "in", categoryIds)
        .where("deleted_at", "is", null)
        .selectAll()
        .execute();
      categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
    }

    const salesChannelRelations = await (this.db as any)
      .selectFrom("product_sales_channels")
      .where("product_id", "in", productIds)
      .select(["product_id", "sales_channel_id"])
      .execute();

    const variantsByProduct = new Map<string, Array<{ id: string }>>();
    for (const v of variants) {
      if (!v.product_id) continue;
      const list = variantsByProduct.get(v.product_id) ?? [];
      list.push({ id: v.id });
      variantsByProduct.set(v.product_id, list);
    }

    const salesChannelsByProduct = new Map<string, string[]>();
    for (const r of salesChannelRelations) {
      const list = salesChannelsByProduct.get(r.product_id) ?? [];
      list.push(r.sales_channel_id);
      salesChannelsByProduct.set(r.product_id, list);
    }

    const products: PaginatedProductItem[] = rows.map((p) => {
      const cat = p.category_id ? categoryMap[p.category_id] : null;
      return {
        id: p.id,
        title: p.title,
        handle: p.handle,
        status: p.status,
        thumbnail: p.thumbnail,
        variants: variantsByProduct.get(p.id) ?? [],
        category_id: p.category_id,
        category: cat
          ? { id: cat.id, value: cat.value, handle: cat.handle }
          : null,
        sales_channel_ids: salesChannelsByProduct.get(p.id) ?? [],
      };
    });

    return { products, count: total, offset, limit };
  }
}
