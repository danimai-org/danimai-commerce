import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely, sql } from "kysely";
import type { Database } from "../../../db";
import {
  DeleteInventoryLevelsSchema,
  type DeleteInventoryLevelsProcessOutput,
} from "./delete-inventory-levels.schema";

export const DELETE_INVENTORY_LEVELS_PROCESS = Symbol("DeleteInventoryLevels");

@Process(DELETE_INVENTORY_LEVELS_PROCESS)
export class DeleteInventoryLevelsProcess
  implements ProcessContract<
    typeof DeleteInventoryLevelsSchema,
    DeleteInventoryLevelsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteInventoryLevelsSchema })
    context: ProcessContextType<typeof DeleteInventoryLevelsSchema>
  ) {
    const { input } = context;

    const rows = await this.db
      .selectFrom("inventory_levels")
      .where("id", "in", input.ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (rows.length !== input.ids.length) {
      throw new NotFoundError("Inventory levels not found");
    }

    await this.db
      .deleteFrom("inventory_levels")
      .where("id", "in", input.ids)
      .execute();
  }
}
