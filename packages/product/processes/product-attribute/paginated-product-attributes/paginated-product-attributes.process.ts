import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  SortOrder,
} from "@danimai/core";
import { paginationResponse } from "@danimai/core/pagination";
import { Kysely, sql } from "kysely";
import {
  type PaginatedProductAttributesProcessOutput,
  PaginatedProductAttributesSchema,
} from "./paginated-product-attributes.schema";
import type { Database } from "../../../db/type";

export const PAGINATED_PRODUCT_ATTRIBUTES_PROCESS = Symbol("PaginatedProductAttributes");

@Process(PAGINATED_PRODUCT_ATTRIBUTES_PROCESS)
export class PaginatedProductAttributesProcess
  implements ProcessContract<
    typeof PaginatedProductAttributesSchema,
    PaginatedProductAttributesProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedProductAttributesSchema,
  }) context: ProcessContextType<typeof PaginatedProductAttributesSchema>) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
      search,
    } = input;

    let query = this.db
      .selectFrom("product_attributes")
      .where("deleted_at", "is", null)
      
    if(search && search.trim()) {
      query = query.where("title", "ilike", `%${search.trim()}%`);
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    query = query.orderBy(sql.ref(`${sorting_field}`), sorting_direction);

    const attributes = await query
      .limit(limit)
      .offset((page - 1) * limit)
      .selectAll()
      .execute();

    return paginationResponse(attributes, total, input);
  }
}
