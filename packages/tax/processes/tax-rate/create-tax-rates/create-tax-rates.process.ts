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
  type CreateTaxRateProcessInput,
  CreateTaxRatesSchema,
} from "./create-tax-rates.schema";
import type { Database, TaxRate } from "@danimai/tax/db";

export const CREATE_TAX_RATES_PROCESS = Symbol("CreateTaxRates");

@Process(CREATE_TAX_RATES_PROCESS)
export class CreateTaxRatesProcess implements ProcessContract<TaxRate[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateTaxRatesSchema })
    context: ProcessContextType<typeof CreateTaxRatesSchema>
  ) {
    const { input } = context;
    const created: TaxRate[] = [];
    for (const r of input.tax_rates) {
      const row = await this.createTaxRate(r);
      if (row) created.push(row);
    }
    return created;
  }

  async createTaxRate(input: CreateTaxRateProcessInput) {
    this.logger.info("Creating tax rate", { input });
    return this.db
      .insertInto("tax_rates")
      .values({
        tax_region_id: input.tax_region_id,
        name: input.name,
        code: input.code ?? null,
        rate: input.rate,
        is_combinable: input.is_combinable ?? false,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
