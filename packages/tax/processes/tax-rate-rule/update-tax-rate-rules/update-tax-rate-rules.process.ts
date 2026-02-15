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
  type UpdateTaxRateRuleProcessInput,
  UpdateTaxRateRuleSchema,
} from "./update-tax-rate-rules.schema";
import type { Database, TaxRateRule } from "@danimai/tax/db";

export const UPDATE_TAX_RATE_RULES_PROCESS = Symbol("UpdateTaxRateRules");

@Process(UPDATE_TAX_RATE_RULES_PROCESS)
export class UpdateTaxRateRulesProcess
  implements ProcessContract<TaxRateRule | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: UpdateTaxRateRuleSchema })
    context: ProcessContextType<typeof UpdateTaxRateRuleSchema>
  ) {
    const { input } = context;
    await this.validateTaxRateRule(input);
    return this.updateTaxRateRule(input);
  }

  async validateTaxRateRule(input: UpdateTaxRateRuleProcessInput) {
    const row = await this.db
      .selectFrom("tax_rate_rules")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Tax rate rule not found", [
        { type: "not_found", message: "Tax rate rule not found", path: "id" },
      ]);
    }
    return row;
  }

  async updateTaxRateRule(input: UpdateTaxRateRuleProcessInput) {
    this.logger.info("Updating tax rate rule", { input });
    const updateData: {
      tax_rate_id?: string;
      rule_type?: string;
      value?: string;
      metadata?: unknown;
    } = {};
    if (input.tax_rate_id !== undefined) updateData.tax_rate_id = input.tax_rate_id;
    if (input.rule_type !== undefined) updateData.rule_type = input.rule_type;
    if (input.value !== undefined) updateData.value = input.value;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    return this.db
      .updateTable("tax_rate_rules")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
