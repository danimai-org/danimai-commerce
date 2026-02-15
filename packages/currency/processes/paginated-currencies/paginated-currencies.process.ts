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
  type PaginatedCurrenciesProcessInput,
  PaginatedCurrenciesSchema,
} from "./paginated-currencies.schema";
import type { Database, Currency } from "@danimai/currency/db";

export const PAGINATED_CURRENCIES_PROCESS = Symbol("PaginatedCurrencies");

@Process(PAGINATED_CURRENCIES_PROCESS)
export class PaginatedCurrenciesProcess
  implements ProcessContract<PaginationResponseType<Currency>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: PaginatedCurrenciesSchema })
    context: ProcessContextType<typeof PaginatedCurrenciesSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input as PaginatedCurrenciesProcessInput;

    let query = this.db
      .selectFrom("currencies")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "code",
      "name",
      "tax_inclusive_pricing",
      "created_at",
      "updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field ?? "")
      ? sorting_field
      : "created_at";
    query = query.orderBy(
      sql.ref(`currencies.${safeSortField}`),
      sortOrder
    );

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();
    return paginationResponse<Currency>(data, total, input as PaginatedCurrenciesProcessInput);
  }
}
