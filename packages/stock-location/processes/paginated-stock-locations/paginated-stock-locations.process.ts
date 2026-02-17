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

export const PAGINATED_STOCK_LOCATIONS_PROCESS = Symbol(
  "PaginatedStockLocations",
);

@Process(PAGINATED_STOCK_LOCATIONS_PROCESS)
export class PaginatedStockLocationsProcess implements ProcessContract<
  PaginationResponseType<StockLocation>
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({ schema: PaginatedStockLocationsSchema })
    context: ProcessContextType<typeof PaginatedStockLocationsSchema>,
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
      .where("stock_locations.deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
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
      sortOrder,
    );

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
        "stock_location_addresses.address_1 as address_1",
        "stock_location_addresses.address_2 as address_2",
        "stock_location_addresses.company as company",
        "stock_location_addresses.city as city",
        "stock_location_addresses.province as province",
        "stock_location_addresses.postal_code as postal_code",
        "stock_location_addresses.country_code as country_code",
        "stock_location_addresses.phone as phone",
      ])
      .limit(limit)
      .offset(offset)
      .execute();

    const data = rows.map((row) => {
      const {
        address_1,
        address_2,
        company,
        city,
        province,
        postal_code,
        country_code,
        phone,
        ...location
      } = row;
      const hasAddress =
        address_1 != null ||
        address_2 != null ||
        company != null ||
        city != null ||
        province != null ||
        postal_code != null ||
        country_code != null ||
        phone != null;
      return {
        ...location,
        address: hasAddress
          ? {
              address_1: address_1 ?? null,
              address_2: address_2 ?? null,
              company: company ?? null,
              city: city ?? null,
              province: province ?? null,
              postal_code: postal_code ?? null,
              country_code: country_code ?? null,
              phone: phone ?? null,
            }
          : null,
      };
    });

    return paginationResponse<
      StockLocation & { address: Record<string, string | null> | null }
    >(data, total, input);
  }
}
