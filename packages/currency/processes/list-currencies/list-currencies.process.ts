import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type ListCurrenciesProcessInput,
  ListCurrenciesSchema,
} from "./list-currencies.schema";
import type { Database, Currency } from "@danimai/currency/db";

/**
 * Danimai-style listCurrencies: list currencies with optional filters.
 */
export const LIST_CURRENCIES_PROCESS = Symbol("ListCurrencies");

@Process(LIST_CURRENCIES_PROCESS)
export class ListCurrenciesProcess implements ProcessContract<Currency[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: ListCurrenciesSchema })
    context: ProcessContextType<typeof ListCurrenciesSchema>
  ) {
    const input = context.input as ListCurrenciesProcessInput;

    let query = this.db
      .selectFrom("currencies")
      .where("deleted_at", "is", null);

    if (input.code) {
      query = query.where("code", "=", input.code);
    }
    if (input.codes && input.codes.length > 0) {
      query = query.where("code", "in", input.codes);
    }

    query = query.orderBy("code", "asc");

    if (input.limit !== undefined) {
      query = query.limit(input.limit);
    }
    if (input.offset !== undefined) {
      query = query.offset(input.offset);
    }

    const data = await query.selectAll().execute();
    return data;
  }
}
