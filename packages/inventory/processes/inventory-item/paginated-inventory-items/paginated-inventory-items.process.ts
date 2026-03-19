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
import type { Database } from "@danimai/inventory/db";
import {
  PaginatedInventoryItemsSchema,
  type PaginatedInventoryItemsProcessOutput,
} from "./paginated-inventory-items.schema";

export const PAGINATED_INVENTORY_ITEMS_PROCESS = Symbol("PaginatedInventoryItems");

@Process(PAGINATED_INVENTORY_ITEMS_PROCESS)
export class PaginatedInventoryItemsProcess
  implements ProcessContract<
    typeof PaginatedInventoryItemsSchema,
    PaginatedInventoryItemsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedInventoryItemsSchema })
    context: ProcessContextType<typeof PaginatedInventoryItemsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "inventory_items.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("inventory_items")
      .where("deleted_at", "is", null);

    if (input.filters?.sku) {
      query = query.where("sku", "=", input.filters.sku);
    }
    if (input.filters?.requires_shipping !== undefined) {
      query = query.where("requires_shipping", "=", input.filters.requires_shipping);
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
