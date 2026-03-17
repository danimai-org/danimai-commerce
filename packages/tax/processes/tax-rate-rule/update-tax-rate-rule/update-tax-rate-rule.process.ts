import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateTaxRateRuleProcessInput,
  type UpdateTaxRateRulesProcessOutput,
  UpdateTaxRateRuleSchema,
} from "./update-tax-rate-rule.schema";
import type { Database } from "@danimai/tax/db";

export const UPDATE_TAX_RATE_RULES_PROCESS = Symbol("UpdateTaxRateRules");

@Process(UPDATE_TAX_RATE_RULES_PROCESS)
export class UpdateTaxRateRulesProcess
  implements ProcessContract<
    typeof UpdateTaxRateRuleSchema,
    UpdateTaxRateRulesProcessOutput
  > {
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
    const taxRateRule = await this.db
      .selectFrom("tax_rate_rules")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!taxRateRule) {
      throw new NotFoundError("Tax rate rule not found");
    }

    return this.db
      .updateTable("tax_rate_rules")
      .set({
        ...input,
        updated_at: sql`now()`,
        id: undefined
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
