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
  type PaginatedTaxRegionsProcessInput,
  PaginatedTaxRegionsSchema,
} from "./paginated-tax-regions.schema";
import type { Database, TaxRegion } from "@danimai/tax/db";

export const PAGINATED_TAX_REGIONS_PROCESS = Symbol("PaginatedTaxRegions");

@Process(PAGINATED_TAX_REGIONS_PROCESS)
export class PaginatedTaxRegionsProcess
  implements ProcessContract<PaginationResponseType<TaxRegion>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedTaxRegionsSchema })
    context: ProcessContextType<typeof PaginatedTaxRegionsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("tax_regions")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "name",
      "tax_provider_id",
      "parent_id",
      "created_at",
      "updated_at",
      "deleted_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(sql.ref(`tax_regions.${safeSortField}`), sortOrder);

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();
    return paginationResponse<TaxRegion>(data, total, input);
  }
}
