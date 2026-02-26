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
  PaginatedOrdersQuerySchema,
} from "./paginated-orders.schema";
import type { Database, Order } from "@danimai/order/db";

export const PAGINATED_ORDERS_PROCESS = Symbol("PaginatedOrders");

@Process(PAGINATED_ORDERS_PROCESS)
export class PaginatedOrdersProcess
  implements ProcessContract<PaginationResponseType<Order>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedOrdersQuerySchema })
    context: ProcessContextType<typeof PaginatedOrdersQuerySchema>
  ) {
    const { input } = context;
    const page = typeof input.page === "number" ? input.page : (typeof input.page === "string" ? Math.max(1, parseInt(input.page, 10) || 1) : 1);
    const limit = typeof input.limit === "number" ? input.limit : (typeof input.limit === "string" ? Math.min(100, Math.max(1, parseInt(input.limit, 10) || 10)) : 10);
    const {
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("orders")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "status",
      "fulfillment_status",
      "payment_status",
      "display_id",
      "currency_code",
      "email",
      "customer_id",
      "sales_channel_id",
      "region_id",
      "created_at",
      "updated_at",
      "deleted_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(sql.ref(`orders.${safeSortField}`), sortOrder);

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();
    return paginationResponse<Order>(data, total, { ...input, page, limit });
  }
}
