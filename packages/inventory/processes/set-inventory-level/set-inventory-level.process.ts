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
  type SetInventoryLevelProcessInput,
  SetInventoryLevelSchema,
} from "./set-inventory-level.schema";
import type { Database, InventoryLevel } from "../../db/type";

export const SET_INVENTORY_LEVEL_PROCESS = Symbol("SetInventoryLevel");

@Process(SET_INVENTORY_LEVEL_PROCESS)
export class SetInventoryLevelProcess
  implements ProcessContract<InventoryLevel | null>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: SetInventoryLevelSchema,
    })
    context: ProcessContextType<typeof SetInventoryLevelSchema>
  ) {
    const { input } = context;
    return this.setInventoryLevel(input);
  }

  async setInventoryLevel(
    input: SetInventoryLevelProcessInput
  ): Promise<InventoryLevel | null> {
    this.logger.info("Setting inventory level", input);

    const item = await this.db
      .selectFrom("inventory_items")
      .where("id", "=", input.inventory_item_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!item) {
      throw new ValidationError("Inventory item not found", [
        {
          type: "not_found",
          message: "Inventory item not found",
          path: "inventory_item_id",
        },
      ]);
    }

    const existing = await this.db
      .selectFrom("inventory_levels")
      .where("inventory_item_id", "=", input.inventory_item_id)
      .where("location_id", "=", input.location_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    const stocked = input.stocked_quantity;
    const reserved = input.reserved_quantity ?? existing?.reserved_quantity ?? 0;
    const available = Math.max(0, stocked - reserved);

    if (existing) {
      const updated = await this.db
        .updateTable("inventory_levels")
        .set({
          stocked_quantity: stocked,
          reserved_quantity: reserved,
          available_quantity: available,
          updated_at: new Date().toISOString(),
        })
        .where("id", "=", existing.id)
        .returningAll()
        .executeTakeFirst();
      return updated ?? null;
    }

    return this.db
      .insertInto("inventory_levels")
      .values({
        inventory_item_id: input.inventory_item_id,
        location_id: input.location_id,
        stocked_quantity: stocked,
        reserved_quantity: reserved,
        available_quantity: available,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
