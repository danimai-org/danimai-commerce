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
  type PaginatedInventoryItemsProcessInput,
  type PaginatedInventoryItemsProcessOutput,
  PaginatedInventoryItemsSchema,
} from "./paginated-inventory-items.schema";
import type { Database } from "../../db/type";

export const PAGINATED_INVENTORY_ITEMS_PROCESS = Symbol(
  "PaginatedInventoryItems"
);

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
      sorting_field = "inventory_items.created_at",
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
      "inventory_items.id",
      "inventory_items.sku",
      "inventory_items.requires_shipping",
      "inventory_items.created_at",
      "inventory_items.updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "inventory_items.created_at";
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
