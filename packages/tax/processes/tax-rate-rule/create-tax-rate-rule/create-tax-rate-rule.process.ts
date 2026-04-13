import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type CreateTaxRateRuleProcessOutput,
  CreateTaxRateRuleSchema,
} from "./create-tax-rate-rule.schema";
import type { Database } from "@danimai/tax/db";

/**
 * Handles the create tax rate rule process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_TAX_RATE_RULE_PROCESS = Symbol("CreateTaxRateRule");

@Process(CREATE_TAX_RATE_RULE_PROCESS)
export class CreateTaxRateRuleProcess
  implements ProcessContract<
    typeof CreateTaxRateRuleSchema,
    CreateTaxRateRuleProcessOutput
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
    @ProcessContext({ schema: CreateTaxRateRuleSchema })
    context: ProcessContextType<typeof CreateTaxRateRuleSchema>
  ) {
    const { input } = context;

    return this.db
      .insertInto("tax_rate_rules")
      .values({
        tax_rate_id: input.tax_rate_id,
        rule_type: input.rule_type,
        value: input.value,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
