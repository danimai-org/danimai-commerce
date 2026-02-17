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
  type UpdateInventoryItemProcessInput,
  UpdateInventoryItemSchema,
} from "./update-inventory-item.schema";
import type { Database, InventoryItem } from "../../db/type";

export const UPDATE_INVENTORY_ITEM_PROCESS = Symbol("UpdateInventoryItem");

@Process(UPDATE_INVENTORY_ITEM_PROCESS)
export class UpdateInventoryItemProcess
  implements ProcessContract<InventoryItem | null>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: UpdateInventoryItemSchema,
    })
    context: ProcessContextType<typeof UpdateInventoryItemSchema>
  ) {
    const { input } = context;
    return this.updateInventoryItem(input);
  }

  async updateInventoryItem(
    input: UpdateInventoryItemProcessInput
  ): Promise<InventoryItem | null> {
    this.logger.info("Updating inventory item", input);

    const existing = await this.db
      .selectFrom("inventory_items")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!existing) {
      throw new ValidationError("Inventory item not found", [
        {
          type: "not_found",
          message: "Inventory item not found",
          path: "id",
        },
      ]);
    }

    const updates: { sku?: string | null; requires_shipping?: boolean; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (input.sku !== undefined) updates.sku = input.sku;
    if (input.requires_shipping !== undefined)
      updates.requires_shipping = input.requires_shipping;

    const updated = await this.db
      .updateTable("inventory_items")
      .set(updates)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();

    return updated ?? null;
  }
}
