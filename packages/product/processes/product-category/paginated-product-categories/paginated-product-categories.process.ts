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
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type PaginatedProductCategoriesProcessInput, PaginatedProductCategoriesSchema } from "./paginated-product-categories.schema";
import type { Database, ProductCategory } from "../../../db/type";

export const PAGINATED_PRODUCT_CATEGORIES_PROCESS = Symbol("PaginatedProductCategories");

// TODO: Implement filters later
@Process(PAGINATED_PRODUCT_CATEGORIES_PROCESS)
export class PaginatedProductCategoriesProcess
  implements ProcessContract<PaginationResponseType<ProductCategory>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedProductCategoriesSchema,
  }) context: ProcessContextType<typeof PaginatedProductCategoriesSchema>) {
    const { input } = context;
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC } = input;

    // Build base query for product categories
    let query = this.db
      .selectFrom("product_categories")
      .where("deleted_at", "is", null);

    // Get total count before pagination
    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    // Apply sorting using sql template for dynamic column names
    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    // Validate sorting_field against allowed columns to prevent SQL injection
    const allowedSortFields = ["id", "value", "parent_id", "status", "visibility", "created_at", "updated_at", "deleted_at"];
    const safeSortField = allowedSortFields.includes(sorting_field) ? sorting_field : "created_at";
    query = query.orderBy(sql.ref(`product_categories.${safeSortField}`), sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    // Return paginated response
    return paginationResponse<ProductCategory>(data, total, input);
  }
}
