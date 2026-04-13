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
  type UpdateTaxRateProcessInput,
  type UpdateTaxRatesProcessOutput,
  UpdateTaxRateSchema,
} from "./update-tax-rate.schema";
import type { Database, TaxRate } from "@danimai/tax/db";

/**
 * Handles the update tax rates process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_TAX_RATES_PROCESS = Symbol("UpdateTaxRates");

@Process(UPDATE_TAX_RATES_PROCESS)
export class UpdateTaxRatesProcess
  implements ProcessContract<
    typeof UpdateTaxRateSchema,
    UpdateTaxRatesProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: UpdateTaxRateSchema })
    context: ProcessContextType<typeof UpdateTaxRateSchema>
  ) {
    const { input } = context;
    const rate = await this.db
      .selectFrom("tax_rates")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!rate) {
      throw new NotFoundError("Tax rate not found");
    }
    return this.db
      .updateTable("tax_rates")
      .set({
        ...input,
        updated_at: sql`now()`,
        id: undefined
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
