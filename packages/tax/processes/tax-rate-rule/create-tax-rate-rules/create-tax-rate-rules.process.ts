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
  type CreateTaxRateRuleProcessInput,
  CreateTaxRateRulesSchema,
} from "./create-tax-rate-rules.schema";
import type { Database, TaxRateRule } from "@danimai/tax/db";

export const CREATE_TAX_RATE_RULES_PROCESS = Symbol("CreateTaxRateRules");

@Process(CREATE_TAX_RATE_RULES_PROCESS)
export class CreateTaxRateRulesProcess
  implements ProcessContract<TaxRateRule[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateTaxRateRulesSchema })
    context: ProcessContextType<typeof CreateTaxRateRulesSchema>
  ) {
    const { input } = context;
    const created: TaxRateRule[] = [];
    for (const r of input.tax_rate_rules) {
      const row = await this.createTaxRateRule(r);
      if (row) created.push(row);
    }
    return created;
  }

  async createTaxRateRule(input: CreateTaxRateRuleProcessInput) {
    this.logger.info("Creating tax rate rule", { input });
    return this.db
      .insertInto("tax_rate_rules")
      .values({
        tax_rate_id: input.tax_rate_id,
        rule_type: input.rule_type,
        value: input.value,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
