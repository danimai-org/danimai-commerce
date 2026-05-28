import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  NotFoundError,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely } from "kysely";
import type { Database } from "../../../db";
import {
  UpdateInventoryLevelSchema,
  type UpdateInventoryLevelProcessOutput,
} from "./update-inventory-level.schema";

/**
 * Handles the update inventory level process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_INVENTORY_LEVEL_PROCESS = Symbol("UpdateInventoryLevel");

@Process(UPDATE_INVENTORY_LEVEL_PROCESS)
export class UpdateInventoryLevelProcess
  implements ProcessContract<
    typeof UpdateInventoryLevelSchema,
    UpdateInventoryLevelProcessOutput
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
    @ProcessContext({ schema: UpdateInventoryLevelSchema })
    context: ProcessContextType<typeof UpdateInventoryLevelSchema>
  ) {
    const { input } = context;

    const item = await this.db
      .selectFrom("inventory_levels")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .select(["inventory_item_id", "id", "stocked_quantity", "reserved_quantity"])
      .executeTakeFirstOrThrow();

    if (!item) {
      throw new NotFoundError("Inventory item not found");
    }


    if (input.location_id) {
      const existingLevel = await this.db.selectFrom("inventory_levels")
        .where("id", "!=", input.id)
        .where("inventory_item_id", "=", item.inventory_item_id)
        .where("location_id", "=", input.location_id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (existingLevel) {
        throw new ValidationError("Inventory level already exists", [{
          type: "already_exists",
          message: "Inventory level already exists for this inventory item and location",
          path: "location_id",
        }]);
      }
    }

    const nextStockedQuantity = input.stocked_quantity ?? item.stocked_quantity;
    const nextReservedQuantity = input.reserved_quantity ?? item.reserved_quantity;

    if (nextReservedQuantity > nextStockedQuantity) {
      throw new ValidationError("Reserved quantity cannot exceed stocked quantity", [{
        type: "invalid",
        message: "Reserved quantity cannot exceed stocked quantity",
        path: "reserved_quantity",
      }]);
    }

    return this.db
      .updateTable("inventory_levels")
      .set({
        ...input,
        available_quantity: nextStockedQuantity - nextReservedQuantity,
        updated_at: new Date(),
      })
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
