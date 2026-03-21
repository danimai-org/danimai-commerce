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
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateCurrencyProcessInput,
  type UpdateCurrencyProcessOutput,
  UpdateCurrencyBodySchema,
} from "./update-currency.schema";
import type { Database } from "../../db";

export const UPDATE_CURRENCY_PROCESS = Symbol("UpdateCurrency");

@Process(UPDATE_CURRENCY_PROCESS)
export class UpdateCurrencyProcess implements ProcessContract<typeof UpdateCurrencyBodySchema, UpdateCurrencyProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: UpdateCurrencyBodySchema })
    context: ProcessContextType<typeof UpdateCurrencyBodySchema>
  ) {
    const { input } = context;

    const currency = await this.db
      .selectFrom("currencies")
      .where("id", "=", input.id)
      .selectAll()
      .executeTakeFirst();

    if (!currency) {
      throw new NotFoundError("Currency not found");
    }
    const { id, ...updates } = input;
    return this.db
      .updateTable("currencies")
      .set({ ...updates, updated_at: sql`now()` })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
