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
  type PaginatedTaxProvidersProcessInput,
  PaginatedTaxProvidersSchema,
} from "./paginated-tax-providers.schema";
import type { Database, TaxProvider } from "@danimai/tax/db";

export const PAGINATED_TAX_PROVIDERS_PROCESS = Symbol("PaginatedTaxProviders");

@Process(PAGINATED_TAX_PROVIDERS_PROCESS)
export class PaginatedTaxProvidersProcess
  implements ProcessContract<PaginationResponseType<TaxProvider>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedTaxProvidersSchema })
    context: ProcessContextType<typeof PaginatedTaxProvidersSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("tax_providers")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "name",
      "is_installed",
      "created_at",
      "updated_at",
      "deleted_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(
      sql.ref(`tax_providers.${safeSortField}`),
      sortOrder
    );

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();
    return paginationResponse<TaxProvider>(data, total, input);
  }
}
