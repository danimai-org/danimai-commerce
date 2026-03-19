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
import { Kysely, sql } from "kysely";
import type { Database } from "../../../db";
import {
  UpdateInventoryLevelSchema,
  type UpdateInventoryLevelProcessOutput,
} from "./update-inventory-level.schema";

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

  async runOperations(
    @ProcessContext({ schema: UpdateInventoryLevelSchema })
    context: ProcessContextType<typeof UpdateInventoryLevelSchema>
  ) {
    const { input } = context;

    const item = await this.db
      .selectFrom("inventory_levels")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .select(["inventory_item_id", "id"])
      .executeTakeFirstOrThrow();

    if (!item) {
      throw new NotFoundError("Inventory item not found");
    }


    if (input.location_id) {
      const existingLevel = await this.db.selectFrom("inventory_levels")
        .where("id", "!=", input.id)
        .where("inventory_item_id", "=", item.inventory_item_id)
        .where("location_id", "=", input.location_id)
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

    return this.db
      .updateTable("inventory_levels")
      .set({
        ...input,
        updated_at: new Date(),
      })
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
