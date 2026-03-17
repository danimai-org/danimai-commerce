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
