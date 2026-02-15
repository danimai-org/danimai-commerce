import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  type PaginationResponseType,
  paginationResponse,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type PaginatedTaxRateRulesProcessInput,
  PaginatedTaxRateRulesSchema,
} from "./paginated-tax-rate-rules.schema";
import type { Database, TaxRateRule } from "@danimai/tax/db";

export const PAGINATED_TAX_RATE_RULES_PROCESS = Symbol("PaginatedTaxRateRules");

@Process(PAGINATED_TAX_RATE_RULES_PROCESS)
export class PaginatedTaxRateRulesProcess
  implements ProcessContract<PaginationResponseType<TaxRateRule>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedTaxRateRulesSchema })
    context: ProcessContextType<typeof PaginatedTaxRateRulesSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("tax_rate_rules")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "tax_rate_id",
      "rule_type",
      "value",
      "created_at",
      "updated_at",
      "deleted_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(
      sql.ref(`tax_rate_rules.${safeSortField}`),
      sortOrder
    );

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();
    return paginationResponse<TaxRateRule>(data, total, input);
  }
}
