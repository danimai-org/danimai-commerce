import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  NotFoundError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely, sql } from "kysely";
import type { Database } from "../../../db";
import {
  DeleteInventoryItemsSchema,
  type DeleteInventoryItemsProcessOutput,
} from "./delete-inventory-items.schema";

export const DELETE_INVENTORY_ITEMS_PROCESS = Symbol("DeleteInventoryItems");

@Process(DELETE_INVENTORY_ITEMS_PROCESS)
export class DeleteInventoryItemsProcess
  implements ProcessContract<
    typeof DeleteInventoryItemsSchema,
    DeleteInventoryItemsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteInventoryItemsSchema })
    context: ProcessContextType<typeof DeleteInventoryItemsSchema>
  ) {
    const { input } = context;
    this.logger.info("Deleting inventory items", { ids: input.ids });

    const rows = await this.db
      .selectFrom("inventory_items")
      .where("id", "in", input.ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (rows.length !== input.ids.length) {
      throw new NotFoundError("Inventory items not found");
    }

    await this.db.deleteFrom("inventory_items").where("id", "in", input.ids).execute();
  }
}
