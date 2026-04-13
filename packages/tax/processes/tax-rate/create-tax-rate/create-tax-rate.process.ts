import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type CreateTaxRateProcessOutput,
  CreateTaxRateSchema,
} from "./create-tax-rate.schema";
import type { Database } from "@danimai/tax/db";

/**
 * Handles the create tax rate process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_TAX_RATE_PROCESS = Symbol("CreateTaxRate");

@Process(CREATE_TAX_RATE_PROCESS)
export class CreateTaxRateProcess
  implements ProcessContract<
    typeof CreateTaxRateSchema,
    CreateTaxRateProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: CreateTaxRateSchema })
    context: ProcessContextType<typeof CreateTaxRateSchema>
  ) {
    const { input } = context;

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
      .executeTakeFirstOrThrow();
  }

}
