import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  SortOrder,
  paginationResponse,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely, sql } from "kysely";
import type { Database } from "../../../db";
import {
  PaginatedInventoryLevelsSchema,
  type PaginatedInventoryLevelsProcessOutput,
} from "./paginated-inventory-levels.schema";

/**
 * Handles the paginated inventory levels process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const PAGINATED_INVENTORY_LEVELS_PROCESS = Symbol("PaginatedInventoryLevels");

@Process(PAGINATED_INVENTORY_LEVELS_PROCESS)
export class PaginatedInventoryLevelsProcess
  implements ProcessContract<
    typeof PaginatedInventoryLevelsSchema,
    PaginatedInventoryLevelsProcessOutput
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
    @ProcessContext({ schema: PaginatedInventoryLevelsSchema })
    context: ProcessContextType<typeof PaginatedInventoryLevelsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "inventory_levels.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("inventory_levels")
      .where("deleted_at", "is", null);

    if (input.filters?.inventory_item_id) {
      query = query.where("inventory_item_id", "=", input.filters.inventory_item_id);
    }
    if (input.filters?.location_id) {
      query = query.where("location_id", "=", input.filters.location_id);
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (Number(page) - 1) * Number(limit);
    const rows = await query
      .selectAll()
      .limit(Number(limit))
      .offset(Number(offset))
      .execute();

    return paginationResponse(rows, total, input);
  }
}
