import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely, sql } from "kysely";
import type { Database } from "../../../db";
import {
  UpdateInventoryItemSchema,
  type UpdateInventoryItemProcessOutput,
} from "./update-inventory-item.schema";

/**
 * Handles the update inventory item process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_INVENTORY_ITEM_PROCESS = Symbol("UpdateInventoryItem");

@Process(UPDATE_INVENTORY_ITEM_PROCESS)
export class UpdateInventoryItemProcess
  implements ProcessContract<
    typeof UpdateInventoryItemSchema,
    UpdateInventoryItemProcessOutput
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
    @ProcessContext({ schema: UpdateInventoryItemSchema })
    context: ProcessContextType<typeof UpdateInventoryItemSchema>
  ) {
    const { input } = context;
    this.logger.info("Updating inventory item", { input });

    return this.db
      .updateTable("inventory_items")
      .set({
        ...input,
        id: undefined,
        updated_at: sql`now()`,
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
