import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type RetrieveTaxRateRuleProcessOutput,
  RetrieveTaxRateRuleSchema,
} from "./retrieve-tax-rate-rule.schema";
import type { Database } from "@danimai/tax/db";

export const RETRIEVE_TAX_RATE_RULE_PROCESS = Symbol("RetrieveTaxRateRule");

@Process(RETRIEVE_TAX_RATE_RULE_PROCESS)
export class RetrieveTaxRateRuleProcess
  implements ProcessContract<
    typeof RetrieveTaxRateRuleSchema,
    RetrieveTaxRateRuleProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  async runOperations(
    @ProcessContext({ schema: RetrieveTaxRateRuleSchema })
    context: ProcessContextType<typeof RetrieveTaxRateRuleSchema>
  ) {
    const { input } = context;

    return this.db
      .selectFrom("tax_rate_rules")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
  }
}
