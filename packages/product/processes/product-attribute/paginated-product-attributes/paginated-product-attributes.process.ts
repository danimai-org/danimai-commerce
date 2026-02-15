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
import { type PaginatedProductAttributesProcessInput, PaginatedProductAttributesSchema } from "./paginated-product-attributes.schema";
import type { Database, ProductAttribute } from "../../../db/type";

export const PAGINATED_PRODUCT_ATTRIBUTES_PROCESS = Symbol("PaginatedProductAttributes");

@Process(PAGINATED_PRODUCT_ATTRIBUTES_PROCESS)
export class PaginatedProductAttributesProcess
  implements ProcessContract<PaginationResponseType<ProductAttribute>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedProductAttributesSchema,
  }) context: ProcessContextType<typeof PaginatedProductAttributesSchema>) {
    const { input } = context;
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC } = input;

    let query = this.db
      .selectFrom("product_attributes")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = ["id", "title", "type", "created_at", "updated_at", "deleted_at"];
    const safeSortField = allowedSortFields.includes(sorting_field) ? sorting_field : "created_at";
    query = query.orderBy(sql.ref(`product_attributes.${safeSortField}`), sortOrder);

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse<ProductAttribute>(data, total, input);
  }
}
