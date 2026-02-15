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
  type UpdateTaxRateProcessInput,
  UpdateTaxRateSchema,
} from "./update-tax-rates.schema";
import type { Database, TaxRate } from "@danimai/tax/db";

export const UPDATE_TAX_RATES_PROCESS = Symbol("UpdateTaxRates");

@Process(UPDATE_TAX_RATES_PROCESS)
export class UpdateTaxRatesProcess
  implements ProcessContract<TaxRate | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: UpdateTaxRateSchema })
    context: ProcessContextType<typeof UpdateTaxRateSchema>
  ) {
    const { input } = context;
    await this.validateTaxRate(input);
    return this.updateTaxRate(input);
  }

  async validateTaxRate(input: UpdateTaxRateProcessInput) {
    const row = await this.db
      .selectFrom("tax_rates")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Tax rate not found", [
        { type: "not_found", message: "Tax rate not found", path: "id" },
      ]);
    }
    return row;
  }

  async updateTaxRate(input: UpdateTaxRateProcessInput) {
    this.logger.info("Updating tax rate", { input });
    const updateData: {
      tax_region_id?: string;
      name?: string;
      code?: string | null;
      rate?: string;
      is_combinable?: boolean;
      metadata?: unknown;
    } = {};
    if (input.tax_region_id !== undefined) updateData.tax_region_id = input.tax_region_id;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.code !== undefined) updateData.code = input.code;
    if (input.rate !== undefined) updateData.rate = input.rate;
    if (input.is_combinable !== undefined) updateData.is_combinable = input.is_combinable;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    return this.db
      .updateTable("tax_rates")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
