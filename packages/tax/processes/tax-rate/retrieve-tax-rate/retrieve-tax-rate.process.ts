import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type RetrieveTaxRateProcessOutput,
  RetrieveTaxRateSchema,
} from "./retrieve-tax-rate.schema";
import type { Database } from "@danimai/tax/db";

export const RETRIEVE_TAX_RATE_PROCESS = Symbol("RetrieveTaxRate");

@Process(RETRIEVE_TAX_RATE_PROCESS)
export class RetrieveTaxRateProcess
  implements ProcessContract<
    typeof RetrieveTaxRateSchema,
    RetrieveTaxRateProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  async runOperations(
    @ProcessContext({ schema: RetrieveTaxRateSchema })
    context: ProcessContextType<typeof RetrieveTaxRateSchema>
  ) {
    const { input } = context;

    return this.db
      .selectFrom("tax_rates")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
  }
}
