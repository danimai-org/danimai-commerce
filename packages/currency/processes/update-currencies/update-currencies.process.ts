import {
  InjectDB,
  InjectLogger,
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
  UpdateCurrencySchema,
} from "./update-currencies.schema";
import type { Database, Currency } from "@danimai/currency/db";

export const UPDATE_CURRENCY_PROCESS = Symbol("UpdateCurrency");

@Process(UPDATE_CURRENCY_PROCESS)
export class UpdateCurrencyProcess implements ProcessContract<Currency | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: UpdateCurrencySchema })
    context: ProcessContextType<typeof UpdateCurrencySchema>
  ) {
    const input = context.input as UpdateCurrencyProcessInput;
    const existing = await this.db
      .selectFrom("currencies")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!existing) {
      throw new ValidationError(`Currency not found: ${input.id}`, [
        { type: "not_found", message: "Currency not found", path: "id" },
      ]);
    }
    const updateData: Partial<{ tax_inclusive_pricing: boolean }> = {};
    if (input.tax_inclusive_pricing !== undefined) {
      updateData.tax_inclusive_pricing = input.tax_inclusive_pricing;
    }
    if (Object.keys(updateData).length === 0) return existing;
    const row = await this.db
      .updateTable("currencies")
      .set({ ...updateData, updated_at: sql`now()` })
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirst();
    return row;
  }
}
