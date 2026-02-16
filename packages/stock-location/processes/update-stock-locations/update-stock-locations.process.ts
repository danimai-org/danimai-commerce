import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateStockLocationProcessInput,
  UpdateStockLocationSchema,
} from "./update-stock-locations.schema";
import type { Database, StockLocation } from "@danimai/stock-location/db";

export const UPDATE_STOCK_LOCATIONS_PROCESS = Symbol("UpdateStockLocations");

@Process(UPDATE_STOCK_LOCATIONS_PROCESS)
export class UpdateStockLocationsProcess implements ProcessContract<StockLocation | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: UpdateStockLocationSchema })
    context: ProcessContextType<typeof UpdateStockLocationSchema>
  ) {
    const { input } = context;
    await this.validateStockLocation(input);
    return this.updateStockLocation(input);
  }

  async validateStockLocation(input: UpdateStockLocationProcessInput) {
    const row = await this.db
      .selectFrom("stock_locations")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Stock location not found", [
        { type: "not_found", message: "Stock location not found", path: "id" },
      ]);
    }
    return row;
  }

  async updateStockLocation(input: UpdateStockLocationProcessInput) {
    this.logger.info("Updating stock location", { input });
    const updateData: {
      name?: string | null;
      address_id?: string | null;
      metadata?: unknown;
    } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.address_id !== undefined) updateData.address_id = input.address_id;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    return this.db
      .updateTable("stock_locations")
      .set({ ...updateData, updated_at: sql`now()` })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
