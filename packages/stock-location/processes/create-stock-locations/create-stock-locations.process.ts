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
  type CreateStockLocationProcessInput,
  type CreateStockLocationsProcessInput,
  CreateStockLocationsSchema,
} from "./create-stock-locations.schema";
import type { Database, StockLocation } from "@danimai/stock-location/db";

export const CREATE_STOCK_LOCATIONS_PROCESS = Symbol("CreateStockLocations");

@Process(CREATE_STOCK_LOCATIONS_PROCESS)
export class CreateStockLocationsProcess implements ProcessContract<
  StockLocation[]
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({ schema: CreateStockLocationsSchema })
    context: ProcessContextType<typeof CreateStockLocationsSchema>,
  ) {
    const { input } = context;
    const created: StockLocation[] = [];
    for (const sl of input.stock_locations) {
      const row = await this.createStockLocation(sl);
      if (row) created.push(row);
    }
    return created;
  }

  async createStockLocation(input: CreateStockLocationProcessInput) {
    this.logger.info("Creating stock location", { input });
    let addressId: string | null = input.address_id ?? null;

    if (
      input.address &&
      Object.values(input.address).some((v) => v != null && v !== "")
    ) {
      const addr = input.address;
      const addressRow = await this.db
        .insertInto("stock_location_addresses")
        .values({
          stock_location_id: null,
          address_1: addr.address_1 ?? null,
          address_2: addr.address_2 ?? null,
          company: addr.company ?? null,
          city: addr.city ?? null,
          province: addr.province ?? null,
          postal_code: addr.postal_code ?? null,
          country_code: addr.country_code ?? null,
          phone: addr.phone ?? null,
          metadata: null,
        })
        .returningAll()
        .executeTakeFirst();
      if (addressRow) addressId = addressRow.id;
    }

    const locationRow = await this.db
      .insertInto("stock_locations")
      .values({
        name: input.name ?? null,
        address_id: addressId,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();

    if (locationRow && addressId) {
      await this.db
        .updateTable("stock_location_addresses")
        .set({ stock_location_id: locationRow.id })
        .where("id", "=", addressId)
        .execute();
    }

    return locationRow ?? null;
  }
}
