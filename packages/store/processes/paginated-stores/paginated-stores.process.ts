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
import {
  type PaginatedStoresProcessInput,
  PaginatedStoresSchema,
} from "./paginated-stores.schema";
import type { Database, Store } from "@danimai/store/db";

export const PAGINATED_STORES_PROCESS = Symbol("PaginatedStores");

@Process(PAGINATED_STORES_PROCESS)
export class PaginatedStoresProcess
  implements ProcessContract<PaginationResponseType<Store>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedStoresSchema })
    context: ProcessContextType<typeof PaginatedStoresSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input as PaginatedStoresProcessInput;

    let query = this.db
      .selectFrom("stores")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "name",
      "default_currency_code",
      "created_at",
      "updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field ?? "")
      ? sorting_field
      : "created_at";
    query = query.orderBy(
      sql.ref(`stores.${safeSortField}`),
      sortOrder
    );

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();
    return paginationResponse<Store>(data, total, input as PaginatedStoresProcessInput);
  }
}
