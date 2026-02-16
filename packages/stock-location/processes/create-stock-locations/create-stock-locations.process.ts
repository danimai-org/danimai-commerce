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
export class CreateStockLocationsProcess implements ProcessContract<StockLocation[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: CreateStockLocationsSchema })
    context: ProcessContextType<typeof CreateStockLocationsSchema>
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
    return this.db
      .insertInto("stock_locations")
      .values({
        name: input.name ?? null,
        address_id: input.address_id ?? null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
