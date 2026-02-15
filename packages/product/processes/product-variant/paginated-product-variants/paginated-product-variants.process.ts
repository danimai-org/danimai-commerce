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
import { type PaginatedProductVariantsProcessInput, PaginatedProductVariantsSchema } from "./paginated-product-variants.schema";
import type { Database, ProductVariant } from "../../../db/type";

export const PAGINATED_PRODUCT_VARIANTS_PROCESS = Symbol("PaginatedProductVariants");

// TODO: Implement filters later
@Process(PAGINATED_PRODUCT_VARIANTS_PROCESS)
export class PaginatedProductVariantsProcess
  implements ProcessContract<PaginationResponseType<ProductVariant>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedProductVariantsSchema,
  }) context: ProcessContextType<typeof PaginatedProductVariantsSchema>) {
    const { input } = context;
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC } = input;

    // Build base query for product variants
    let query = this.db
      .selectFrom("product_variants")
      .where("deleted_at", "is", null);

    // Get total count before pagination
    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    // Apply sorting using sql template for dynamic column names
    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    // Validate sorting_field against allowed columns to prevent SQL injection
    const allowedSortFields = ["id", "title", "sku", "barcode", "ean", "upc", "product_id", "variant_rank", "allow_backorder", "manage_inventory", "created_at", "updated_at", "deleted_at"];
    const safeSortField = allowedSortFields.includes(sorting_field) ? sorting_field : "created_at";
    query = query
      .orderBy(sql.ref(`product_variants.${safeSortField}`), sortOrder)
      .orderBy("variant_rank", "asc")
      .orderBy("id", "asc");

    // Apply pagination
    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    // Return paginated response
    return paginationResponse<ProductVariant>(data, total, input);
  }
}
