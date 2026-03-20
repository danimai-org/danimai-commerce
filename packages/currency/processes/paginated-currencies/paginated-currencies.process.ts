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
  type PaginatedCurrenciesProcessOutput,
  PaginatedCurrenciesSchema,
} from "./paginated-currencies.schema";
import type { Database } from "../../db";

export const PAGINATED_CURRENCIES_PROCESS = Symbol("PaginatedCurrencies");

@Process(PAGINATED_CURRENCIES_PROCESS)
export class PaginatedCurrenciesProcess
  implements ProcessContract<typeof PaginatedCurrenciesSchema, PaginatedCurrenciesProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedCurrenciesSchema })
    context: ProcessContextType<typeof PaginatedCurrenciesSchema>
  ): Promise<PaginatedCurrenciesProcessOutput> {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("currencies")
      .where("deleted_at", "is", null);

    if (input.filters?.code) {
      query = query.where("code", "=", input.filters.code.trim());
    }
    

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();
    return paginationResponse(data, total, input);
  }
}
