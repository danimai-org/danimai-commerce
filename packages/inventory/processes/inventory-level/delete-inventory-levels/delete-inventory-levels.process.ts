import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely, sql } from "kysely";
import type { Database } from "../../../db";
import {
  DeleteInventoryLevelsSchema,
  type DeleteInventoryLevelsProcessOutput,
} from "./delete-inventory-levels.schema";

/**
 * Handles the delete inventory levels process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const DELETE_INVENTORY_LEVELS_PROCESS = Symbol("DeleteInventoryLevels");

@Process(DELETE_INVENTORY_LEVELS_PROCESS)
export class DeleteInventoryLevelsProcess
  implements ProcessContract<
    typeof DeleteInventoryLevelsSchema,
    DeleteInventoryLevelsProcessOutput
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
    @ProcessContext({ schema: DeleteInventoryLevelsSchema })
    context: ProcessContextType<typeof DeleteInventoryLevelsSchema>
  ) {
    const { input } = context;

    const rows = await this.db
      .selectFrom("inventory_levels")
      .where("id", "in", input.ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (rows.length !== input.ids.length) {
      throw new NotFoundError("Inventory levels not found");
    }

    await this.db
      .deleteFrom("inventory_levels")
      .where("id", "in", input.ids)
      .execute();
  }
}
