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
  type DeleteInventoryLevelProcessInput,
  DeleteInventoryLevelSchema,
} from "./delete-inventory-level.schema";
import type { Database } from "../../db/type";

export const DELETE_INVENTORY_LEVEL_PROCESS = Symbol("DeleteInventoryLevel");

@Process(DELETE_INVENTORY_LEVEL_PROCESS)
export class DeleteInventoryLevelProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: DeleteInventoryLevelSchema })
    context: ProcessContextType<typeof DeleteInventoryLevelSchema>
  ): Promise<void> {
    const { input } = context;
    return this.deleteInventoryLevel(input);
  }

  async deleteInventoryLevel(input: DeleteInventoryLevelProcessInput) {
    this.logger.info("Deleting inventory level", { id: input.id });
    await this.db
      .updateTable("inventory_levels")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .execute();
  }
}
