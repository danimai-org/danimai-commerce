import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type DeleteStockLocationsProcessInput,
  DeleteStockLocationsSchema,
} from "./delete-stock-locations.schema";
import type { Database } from "@danimai/stock-location/db";

export const DELETE_STOCK_LOCATIONS_PROCESS = Symbol("DeleteStockLocations");

@Process(DELETE_STOCK_LOCATIONS_PROCESS)
export class DeleteStockLocationsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: DeleteStockLocationsSchema })
    context: ProcessContextType<typeof DeleteStockLocationsSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateStockLocations(input);
    await this.deleteStockLocations(input);
  }

  async validateStockLocations(input: DeleteStockLocationsProcessInput) {
    const rows = await this.db
      .selectFrom("stock_locations")
      .where("id", "in", input.stock_location_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.stock_location_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.stock_location_ids.filter((id) => !found.includes(id));
      throw new ValidationError(
        `Stock locations not found: ${missing.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Stock locations not found: ${missing.join(", ")}`,
            path: "stock_location_ids",
          },
        ]
      );
    }
    return rows;
  }

  async deleteStockLocations(input: DeleteStockLocationsProcessInput) {
    this.logger.info("Deleting stock locations", { stock_location_ids: input.stock_location_ids });
    await this.db
      .updateTable("stock_locations")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.stock_location_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
