import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type DeleteStockLocationsProcessOutput,
  DeleteStockLocationsSchema,
} from "./delete-stock-locations.schema";
import type { Database } from "../../db";

/**
 * Handles the delete stock locations process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const DELETE_STOCK_LOCATIONS_PROCESS = Symbol("DeleteStockLocations");

@Process(DELETE_STOCK_LOCATIONS_PROCESS)
export class DeleteStockLocationsProcess
  implements
  ProcessContract<
    typeof DeleteStockLocationsSchema,
    DeleteStockLocationsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: DeleteStockLocationsSchema })
    context: ProcessContextType<typeof DeleteStockLocationsSchema>
  ): Promise<void> {
    const { input } = context;
    const locations = await this.db.selectFrom("stock_locations")
      .where("id", "in", input.ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (locations.length !== input.ids.length) {
      throw new NotFoundError("Stock locations not found");
    }

    await this.db
      .deleteFrom("stock_locations")
      .where("id", "in", input.ids)
      .execute();
  }

}
