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
  type PaginatedInventoryItemsProcessInput,
  PaginatedInventoryItemsSchema,
} from "./paginated-inventory-items.schema";
import type { Database, InventoryItem } from "../../db/type";

export const PAGINATED_INVENTORY_ITEMS_PROCESS = Symbol(
  "PaginatedInventoryItems"
);

@Process(PAGINATED_INVENTORY_ITEMS_PROCESS)
export class PaginatedInventoryItemsProcess
  implements ProcessContract<PaginationResponseType<InventoryItem>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: PaginatedInventoryItemsSchema,
    })
    context: ProcessContextType<typeof PaginatedInventoryItemsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("inventory_items")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    const sortOrder =
      sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "sku",
      "requires_shipping",
      "created_at",
      "updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(
      sql.ref(`inventory_items.${safeSortField}`),
      sortOrder
    );

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse<InventoryItem>(data, total, input);
  }
}
