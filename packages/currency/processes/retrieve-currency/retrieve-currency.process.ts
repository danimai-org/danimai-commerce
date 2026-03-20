import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  RetrieveCurrencySchema,
  type CurrencyProcessOutput,
} from "./retrieve-currency.schema";
import type { Database } from "../../db";

/**
 * Danimai-style retrieveCurrency: retrieve a single currency by id.
 */
export const RETRIEVE_CURRENCY_PROCESS = Symbol("RetrieveCurrency");

@Process(RETRIEVE_CURRENCY_PROCESS)
export class RetrieveCurrencyProcess implements ProcessContract<typeof RetrieveCurrencySchema, CurrencyProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: RetrieveCurrencySchema })
    context: ProcessContextType<typeof RetrieveCurrencySchema>
  ): Promise<CurrencyProcessOutput> {
    const { input } = context;

    const currency = await this.db
      .selectFrom("currencies")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!currency) {
      throw new NotFoundError(`Currency not found`);
    }

    return currency;
  }
}
