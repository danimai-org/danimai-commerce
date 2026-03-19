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
  PaginatedReservationItemsSchema,
  type PaginatedReservationItemsProcessOutput,
} from "./paginated-reservation-items.schema";

export const PAGINATED_RESERVATION_ITEMS_PROCESS = Symbol("PaginatedReservationItems");

@Process(PAGINATED_RESERVATION_ITEMS_PROCESS)
export class PaginatedReservationItemsProcess
  implements ProcessContract<
    typeof PaginatedReservationItemsSchema,
    PaginatedReservationItemsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedReservationItemsSchema })
    context: ProcessContextType<typeof PaginatedReservationItemsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "reservation_items.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("reservation_items")
      .where("deleted_at", "is", null);

    if (input.filters?.inventory_item_id) {
      query = query.where("inventory_item_id", "=", input.filters.inventory_item_id);
    }
    if (input.filters?.location_id) {
      query = query.where("location_id", "=", input.filters.location_id);
    }
    if (input.filters?.line_item_id) {
      query = query.where("line_item_id", "=", input.filters.line_item_id);
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
