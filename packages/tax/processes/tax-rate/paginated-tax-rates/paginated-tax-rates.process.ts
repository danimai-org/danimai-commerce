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
  type PaginatedTaxRatesProcessInput,
  PaginatedTaxRatesSchema,
} from "./paginated-tax-rates.schema";
import type { Database, TaxRate } from "@danimai/tax/db";

export const PAGINATED_TAX_RATES_PROCESS = Symbol("PaginatedTaxRates");

@Process(PAGINATED_TAX_RATES_PROCESS)
export class PaginatedTaxRatesProcess
  implements ProcessContract<PaginationResponseType<TaxRate>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedTaxRatesSchema })
    context: ProcessContextType<typeof PaginatedTaxRatesSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("tax_rates")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "tax_region_id",
      "name",
      "code",
      "rate",
      "is_combinable",
      "created_at",
      "updated_at",
      "deleted_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(sql.ref(`tax_rates.${safeSortField}`), sortOrder);

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();
    return paginationResponse<TaxRate>(data, total, input);
  }
}
