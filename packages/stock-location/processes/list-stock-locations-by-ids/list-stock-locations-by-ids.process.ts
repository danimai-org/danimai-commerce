import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type ListStockLocationsByIdsProcessInput,
  ListStockLocationsByIdsSchema,
} from "./list-stock-locations-by-ids.schema";
import type { Database } from "@danimai/stock-location/db";

export type StockLocationWithAddress = {
  id: string;
  name: string | null;
  address_id: string | null;
  metadata: unknown | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  address: {
    address_1: string | null;
    address_2: string | null;
    company: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    country_code: string | null;
    phone: string | null;
  } | null;
};

export const LIST_STOCK_LOCATIONS_BY_IDS_PROCESS = Symbol(
  "ListStockLocationsByIds"
);

@Process(LIST_STOCK_LOCATIONS_BY_IDS_PROCESS)
export class ListStockLocationsByIdsProcess
  implements ProcessContract<StockLocationWithAddress[]>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: ListStockLocationsByIdsSchema })
    context: ProcessContextType<typeof ListStockLocationsByIdsSchema>
  ): Promise<StockLocationWithAddress[]> {
    const { input } = context;
    if (input.ids.length === 0) return [];

    const rows = await this.db
      .selectFrom("stock_locations")
      .leftJoin(
        "stock_location_addresses",
        "stock_locations.address_id",
        "stock_location_addresses.id"
      )
      .where("stock_locations.id", "in", input.ids)
      .where("stock_locations.deleted_at", "is", null)
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
      .execute();

    return rows.map((row) => {
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
  }
}
