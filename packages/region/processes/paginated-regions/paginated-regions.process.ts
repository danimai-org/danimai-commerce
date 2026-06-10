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
  type PaginatedRegionsProcessOutput,
  PaginatedRegionsSchema,
} from "./paginated-regions.schema";
import type { Database } from "@danimai/region/db";

/**
 * Handles the paginated regions process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const PAGINATED_REGIONS_PROCESS = Symbol("PaginatedRegions");

@Process(PAGINATED_REGIONS_PROCESS)
export class PaginatedRegionsProcess
  implements ProcessContract<typeof PaginatedRegionsSchema, PaginatedRegionsProcessOutput> {
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
    @ProcessContext({
      schema: PaginatedRegionsSchema,
    })
    context: ProcessContextType<typeof PaginatedRegionsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("regions")
      .where("deleted_at", "is", null);

    if (input.filters?.currency_code) {
      query = query.where("currency_code", "=", input.filters.currency_code);
    }

    const search = input.search?.trim();
    if (search) {
      const term = `%${search}%`;
      query = query.where((eb) =>
        eb.or([
          eb("name", "ilike", term),
          eb("code", "ilike", term),
          eb("currency_code", "ilike", term),
        ]),
      );
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (page - 1) * limit;
    const regions = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse(regions, total, input);
  }
}
