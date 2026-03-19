import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  NotFoundError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type StockLocationProcessOutput,
  RetrieveStockLocationSchema,
} from "./retrieve-stock-location.schema";
import type { Database } from "../../db/type";
import type { Static } from "@sinclair/typebox";
import type { StockLocationAddressSchema } from "../paginated-stock-locations/paginated-stock-locations.schema";

export const RETRIEVE_STOCK_LOCATION_PROCESS = Symbol("RetrieveStockLocation");

@Process(RETRIEVE_STOCK_LOCATION_PROCESS)
export class RetrieveStockLocationProcess
  implements
  ProcessContract<typeof RetrieveStockLocationSchema, StockLocationProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: RetrieveStockLocationSchema })
    context: ProcessContextType<typeof RetrieveStockLocationSchema>
  ): Promise<StockLocationProcessOutput> {
    const { input } = context;

    const stockLocation = await this.db
      .selectFrom("stock_locations")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
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
          'address_1', 'stock_location_addresses.address_1',
          'address_2', 'stock_location_addresses.address_2',
          'company', 'stock_location_addresses.company',
          'city', 'stock_location_addresses.city',
          'province', 'stock_location_addresses.province',
          'postal_code', 'stock_location_addresses.postal_code',
          'country_code', 'stock_location_addresses.country_code',
          'phone', 'stock_location_addresses.phone',
        )`.as("address"),
      ])
      .executeTakeFirst();

    if (!stockLocation) {
      throw new NotFoundError("Stock location not found");
    }

    return stockLocation;
  }
}
