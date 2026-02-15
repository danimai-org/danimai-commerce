import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type RetrieveCurrencyProcessInput,
  RetrieveCurrencySchema,
} from "./retrieve-currency.schema";
import type { Database, Currency } from "@danimai/currency/db";

/**
 * Danimai-style retrieveCurrency: retrieve a single currency by id.
 */
export const RETRIEVE_CURRENCY_PROCESS = Symbol("RetrieveCurrency");

@Process(RETRIEVE_CURRENCY_PROCESS)
export class RetrieveCurrencyProcess implements ProcessContract<Currency> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: RetrieveCurrencySchema })
    context: ProcessContextType<typeof RetrieveCurrencySchema>
  ): Promise<Currency> {
    const { input } = context;

    const currency = await this.db
      .selectFrom("currencies")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!currency) {
      throw new ValidationError("Currency not found", [
        {
          type: "not_found",
          message: "Currency not found",
          path: "id",
        },
      ]);
    }

    return currency;
  }
}
