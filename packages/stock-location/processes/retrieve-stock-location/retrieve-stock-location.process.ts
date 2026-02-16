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
  type RetrieveStockLocationProcessInput,
  RetrieveStockLocationSchema,
} from "./retrieve-stock-location.schema";
import type { Database, StockLocation } from "@danimai/stock-location/db";

export const RETRIEVE_STOCK_LOCATION_PROCESS = Symbol("RetrieveStockLocation");

@Process(RETRIEVE_STOCK_LOCATION_PROCESS)
export class RetrieveStockLocationProcess implements ProcessContract<StockLocation> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: RetrieveStockLocationSchema })
    context: ProcessContextType<typeof RetrieveStockLocationSchema>
  ): Promise<StockLocation> {
    const { input } = context;

    const stockLocation = await this.db
      .selectFrom("stock_locations")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!stockLocation) {
      throw new ValidationError("Stock location not found", [
        {
          type: "not_found",
          message: "Stock location not found",
          path: "id",
        },
      ]);
    }

    return stockLocation;
  }
}
