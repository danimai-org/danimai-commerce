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
  type PaginatedProductOptionsProcessOutput,
  PaginatedProductOptionsSchema,
} from "./paginated-product-options.schema";
import type { Database } from "../../../db/type";

export const PAGINATED_PRODUCT_OPTIONS_PROCESS = Symbol("PaginatedProductOptions");

@Process(PAGINATED_PRODUCT_OPTIONS_PROCESS)
export class PaginatedProductOptionsProcess
  implements ProcessContract<
    typeof PaginatedProductOptionsSchema,
    PaginatedProductOptionsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedProductOptionsSchema,
  }) context: ProcessContextType<typeof PaginatedProductOptionsSchema>) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
      search,
    } = input;

    let query = this.db
      .selectFrom("product_options")
      .where("deleted_at", "is", null);

    if(search && search.trim()) {
      query = query.where("title", "ilike", `%${search.trim()}%`);
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    query = query.orderBy(sql.ref(`${sorting_field}`), sorting_direction);

    const options = await query
      .selectAll()
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    return paginationResponse(options, total, input);
  }
}
