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
  type PaginatedStockLocationsProcessOutput,
  PaginatedStockLocationsSchema,
  StockLocationAddressSchema,
} from "./paginated-stock-locations.schema";
import type { Database } from "../../db";
import type { Static } from "@sinclair/typebox";

export const PAGINATED_STOCK_LOCATIONS_PROCESS = Symbol(
  "PaginatedStockLocations",
);

@Process(PAGINATED_STOCK_LOCATIONS_PROCESS)
export class PaginatedStockLocationsProcess
  implements
  ProcessContract<
    typeof PaginatedStockLocationsSchema,
    PaginatedStockLocationsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedStockLocationsSchema })
    context: ProcessContextType<typeof PaginatedStockLocationsSchema>,
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "stock_locations.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("stock_locations")
      .where("stock_locations.deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (page - 1) * limit;
    const rows = await query
      .leftJoin(
        "stock_location_addresses",
        "stock_locations.address_id",
        "stock_location_addresses.id",
      )
      .select([
        "stock_locations.id",
        "stock_locations.name",
        "stock_locations.address_id",
        "stock_locations.metadata",
        "stock_locations.created_at",
        "stock_locations.updated_at",
        "stock_locations.deleted_at",
        (eb) => sql<Static<typeof StockLocationAddressSchema>>`
        jsonb_build_object(
          'address_1', stock_location_addresses.address_1,
          'address_2', stock_location_addresses.address_2,
          'company', stock_location_addresses.company,
          'city', stock_location_addresses.city,
          'province', stock_location_addresses.province,
          'postal_code', stock_location_addresses.postal_code,
          'country_code', stock_location_addresses.country_code,
          'phone', stock_location_addresses.phone
        )`.as("address"),
      ])
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse(rows, total, input);
  }
}
