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
  type DeleteTaxRateRulesProcessInput,
  DeleteTaxRateRulesSchema,
} from "./delete-tax-rate-rules.schema";
import type { Database } from "@danimai/tax/db";

export const DELETE_TAX_RATE_RULES_PROCESS = Symbol("DeleteTaxRateRules");

@Process(DELETE_TAX_RATE_RULES_PROCESS)
export class DeleteTaxRateRulesProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteTaxRateRulesSchema })
    context: ProcessContextType<typeof DeleteTaxRateRulesSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateTaxRateRules(input);
    await this.deleteTaxRateRules(input);
  }

  async validateTaxRateRules(input: DeleteTaxRateRulesProcessInput) {
    const rows = await this.db
      .selectFrom("tax_rate_rules")
      .where("id", "in", input.tax_rate_rule_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.tax_rate_rule_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.tax_rate_rule_ids.filter((id) => !found.includes(id));
      throw new ValidationError(
        `Tax rate rules not found: ${missing.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Tax rate rules not found: ${missing.join(", ")}`,
            path: "tax_rate_rule_ids",
          },
        ]
      );
    }
    return rows;
  }

  async deleteTaxRateRules(input: DeleteTaxRateRulesProcessInput) {
    this.logger.info("Deleting tax rate rules", {
      tax_rate_rule_ids: input.tax_rate_rule_ids,
    });
    await this.db
      .updateTable("tax_rate_rules")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.tax_rate_rule_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
