import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely } from "kysely";
import type { Database } from "../../../db";
import {
  CreateInventoryLevelSchema,
  type CreateInventoryLevelProcessOutput,
} from "./create-inventory-level.schema";

/**
 * Handles the create inventory level process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_INVENTORY_LEVEL_PROCESS = Symbol("CreateInventoryLevel");

@Process(CREATE_INVENTORY_LEVEL_PROCESS)
export class CreateInventoryLevelProcess
  implements ProcessContract<
    typeof CreateInventoryLevelSchema,
    CreateInventoryLevelProcessOutput
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
    @ProcessContext({ schema: CreateInventoryLevelSchema })
    context: ProcessContextType<typeof CreateInventoryLevelSchema>
  ) {
    const { input } = context;
    this.logger.info("Creating inventory level", { input });

    const inventoryItem = await this.db
      .selectFrom("inventory_items")
      .where("id", "=", input.inventory_item_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!inventoryItem) {
      throw new ValidationError("Inventory item not found", [{
        type: "not_found",
        message: "Inventory item not found",
        path: "inventory_item_id",
      }]);
    }

    const existingLevel = await this.db.selectFrom("inventory_levels")
      .where("inventory_item_id", "=", input.inventory_item_id)
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

    if (input.reserved_quantity > input.stocked_quantity) {
      throw new ValidationError("Reserved quantity cannot exceed stocked quantity", [{
        type: "invalid",
        message: "Reserved quantity cannot exceed stocked quantity",
        path: "reserved_quantity",
      }]);
    }

    const availableQuantity = input.stocked_quantity - input.reserved_quantity;

    return this.db
      .insertInto("inventory_levels")
      .values({
        ...input,
        available_quantity: availableQuantity,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
