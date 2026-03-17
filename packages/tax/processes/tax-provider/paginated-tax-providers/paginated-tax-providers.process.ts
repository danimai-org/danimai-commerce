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
  type PaginatedTaxProvidersProcessOutput,
  PaginatedTaxProvidersSchema,
} from "./paginated-tax-providers.schema";
import type { Database } from "@danimai/tax/db";

export const PAGINATED_TAX_PROVIDERS_PROCESS = Symbol("PaginatedTaxProviders");

@Process(PAGINATED_TAX_PROVIDERS_PROCESS)
export class PaginatedTaxProvidersProcess
  implements ProcessContract<
    typeof PaginatedTaxProvidersSchema,
    PaginatedTaxProvidersProcessOutput
  > {
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
      sorting_field = "tax_providers.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("tax_providers")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .orderBy(sql.ref(sorting_field), sorting_direction)
      .execute();

    return paginationResponse(data, total, input);
  }
}
