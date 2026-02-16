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
  type PaginatedStockLocationsProcessInput,
  PaginatedStockLocationsSchema,
} from "./paginated-stock-locations.schema";
import type { Database, StockLocation } from "@danimai/stock-location/db";

export const PAGINATED_STOCK_LOCATIONS_PROCESS = Symbol("PaginatedStockLocations");

@Process(PAGINATED_STOCK_LOCATIONS_PROCESS)
export class PaginatedStockLocationsProcess
  implements ProcessContract<PaginationResponseType<StockLocation>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: PaginatedStockLocationsSchema })
    context: ProcessContextType<typeof PaginatedStockLocationsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("stock_locations")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    const sortOrder =
      sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "name",
      "address_id",
      "created_at",
      "updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(
      sql.ref(`stock_locations.${safeSortField}`),
      sortOrder
    );

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse<StockLocation>(data, total, input);
  }
}
