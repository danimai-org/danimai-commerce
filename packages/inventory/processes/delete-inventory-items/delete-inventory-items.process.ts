import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type DeleteInventoryItemsProcessInput,
  type DeleteInventoryItemsProcessOutput,
  DeleteInventoryItemsSchema,
} from "./delete-inventory-items.schema";
import type { Database } from "../../db/type";

export const DELETE_INVENTORY_ITEMS_PROCESS = Symbol("DeleteInventoryItems");

@Process(DELETE_INVENTORY_ITEMS_PROCESS)
export class DeleteInventoryItemsProcess
  implements
    ProcessContract<
      typeof DeleteInventoryItemsSchema,
      DeleteInventoryItemsProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: DeleteInventoryItemsSchema })
    context: ProcessContextType<typeof DeleteInventoryItemsSchema>
  ): Promise<void> {
    const { input } = context;
    return this.deleteInventoryItems(input);
  }

  async deleteInventoryItems(input: DeleteInventoryItemsProcessInput) {
    this.logger.info("Deleting inventory items", {
      ids: input.inventory_item_ids,
    });
    if (input.inventory_item_ids.length === 0) return;
    const now = new Date();
    await this.db
      .updateTable("inventory_items")
      .set({ deleted_at: now })
      .where("id", "in", input.inventory_item_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
