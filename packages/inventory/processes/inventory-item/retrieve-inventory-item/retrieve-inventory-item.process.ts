import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Database } from "../../../db";
import {
  RetrieveInventoryItemSchema,
  type RetrieveInventoryItemProcessOutput,
} from "./retrieve-inventory-item.schema";

export const RETRIEVE_INVENTORY_ITEM_PROCESS = Symbol("RetrieveInventoryItem");

@Process(RETRIEVE_INVENTORY_ITEM_PROCESS)
export class RetrieveInventoryItemProcess
  implements ProcessContract<typeof RetrieveInventoryItemSchema, RetrieveInventoryItemProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  async runOperations(
    @ProcessContext({ schema: RetrieveInventoryItemSchema })
    context: ProcessContextType<typeof RetrieveInventoryItemSchema>
  ) {
    const { input } = context;

    const item = await this.db
      .selectFrom("inventory_items")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirstOrThrow();

    if (!item) {
      throw new NotFoundError("Inventory item not found");
    }

    const inventoryLevels = await this.db
      .selectFrom("inventory_levels")
      .where("inventory_item_id", "=", item.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const reservationItems = await this.db
      .selectFrom("reservation_items")
      .where("inventory_item_id", "=", item.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    return {
      ...item,
      inventory_levels: inventoryLevels,
      reservation_items: reservationItems,
    };
  }
}
