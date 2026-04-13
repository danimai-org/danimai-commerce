import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  paginationResponse,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type PaginatedTaxRateRulesProcessOutput,
  PaginatedTaxRateRulesSchema,
} from "./paginated-tax-rate-rules.schema";
import type { Database } from "@danimai/tax/db";

/**
 * Handles the paginated tax rate rules process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const PAGINATED_TAX_RATE_RULES_PROCESS = Symbol("PaginatedTaxRateRules");

@Process(PAGINATED_TAX_RATE_RULES_PROCESS)
export class PaginatedTaxRateRulesProcess
  implements ProcessContract<
    typeof PaginatedTaxRateRulesSchema,
    PaginatedTaxRateRulesProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: PaginatedTaxRateRulesSchema })
    context: ProcessContextType<typeof PaginatedTaxRateRulesSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "tax_rate_rules.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("tax_rate_rules")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();
    return paginationResponse(data, total, input);
  }
}
