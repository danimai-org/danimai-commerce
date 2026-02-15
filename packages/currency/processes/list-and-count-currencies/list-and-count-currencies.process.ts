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
  type ListAndCountCurrenciesProcessInput,
  ListAndCountCurrenciesSchema,
} from "./list-and-count-currencies.schema";
import type { Database, Currency } from "@danimai/currency/db";

/**
 * Danimai-style listAndCountCurrencies: returns [currencies, count].
 */
export const LIST_AND_COUNT_CURRENCIES_PROCESS = Symbol(
  "ListAndCountCurrencies"
);

@Process(LIST_AND_COUNT_CURRENCIES_PROCESS)
export class ListAndCountCurrenciesProcess
  implements ProcessContract<[Currency[], number]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: ListAndCountCurrenciesSchema })
    context: ProcessContextType<typeof ListAndCountCurrenciesSchema>
  ): Promise<[Currency[], number]> {
    const input = context.input as ListAndCountCurrenciesProcessInput;
    const {
      page = 1,
      limit = 10,
      sorting_field = "code",
      sorting_direction = SortOrder.ASC,
    } = input;

    let baseQuery = this.db
      .selectFrom("currencies")
      .where("deleted_at", "is", null);

    if (input.code) {
      baseQuery = baseQuery.where("code", "=", input.code);
    }
    if (input.codes && input.codes.length > 0) {
      baseQuery = baseQuery.where("code", "in", input.codes);
    }

    const countResult = await baseQuery
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const count = Number(countResult?.count ?? 0);

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
      : "code";

    const offset = (page - 1) * limit;
    const data = await baseQuery
      .orderBy(sql.ref(`currencies.${safeSortField}`), sortOrder)
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return [data, count];
  }
}
