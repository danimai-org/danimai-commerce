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
  type PaginatedInventoryLevelsProcessInput,
  type PaginatedInventoryLevelsProcessOutput,
  PaginatedInventoryLevelsSchema,
} from "./paginated-inventory-levels.schema";
import type { Database } from "../../db/type";

export const PAGINATED_INVENTORY_LEVELS_PROCESS = Symbol(
  "PaginatedInventoryLevels"
);

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
  ) {}

  async runOperations(
    @ProcessContext({
      schema: PaginatedInventoryLevelsSchema,
    })
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

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    const sortOrder =
      sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "inventory_levels.id",
      "inventory_levels.inventory_item_id",
      "inventory_levels.location_id",
      "inventory_levels.stocked_quantity",
      "inventory_levels.reserved_quantity",
      "inventory_levels.available_quantity",
      "inventory_levels.created_at",
      "inventory_levels.updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "inventory_levels.created_at";
    query = query.orderBy(sql.ref(safeSortField), sortOrder);

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse(data, total, input);
  }
}
