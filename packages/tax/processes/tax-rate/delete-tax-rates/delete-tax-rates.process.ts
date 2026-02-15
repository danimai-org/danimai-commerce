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
  type DeleteTaxRatesProcessInput,
  DeleteTaxRatesSchema,
} from "./delete-tax-rates.schema";
import type { Database } from "@danimai/tax/db";

export const DELETE_TAX_RATES_PROCESS = Symbol("DeleteTaxRates");

@Process(DELETE_TAX_RATES_PROCESS)
export class DeleteTaxRatesProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteTaxRatesSchema })
    context: ProcessContextType<typeof DeleteTaxRatesSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateTaxRates(input);
    await this.deleteTaxRates(input);
  }

  async validateTaxRates(input: DeleteTaxRatesProcessInput) {
    const rows = await this.db
      .selectFrom("tax_rates")
      .where("id", "in", input.tax_rate_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.tax_rate_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.tax_rate_ids.filter((id) => !found.includes(id));
      throw new ValidationError(`Tax rates not found: ${missing.join(", ")}`, [
        { type: "not_found", message: `Tax rates not found: ${missing.join(", ")}`, path: "tax_rate_ids" },
      ]);
    }
    return rows;
  }

  async deleteTaxRates(input: DeleteTaxRatesProcessInput) {
    this.logger.info("Deleting tax rates", { tax_rate_ids: input.tax_rate_ids });
    await this.db
      .updateTable("tax_rates")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.tax_rate_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
