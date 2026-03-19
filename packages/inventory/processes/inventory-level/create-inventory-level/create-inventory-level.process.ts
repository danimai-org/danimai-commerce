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
  CreateInventoryLevelSchema,
  type CreateInventoryLevelProcessOutput,
} from "./create-inventory-level.schema";

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

  async runOperations(
    @ProcessContext({ schema: CreateInventoryLevelSchema })
    context: ProcessContextType<typeof CreateInventoryLevelSchema>
  ) {
    const { input } = context;
    this.logger.info("Creating inventory level", { input });

    const existingLevel = await this.db.selectFrom("inventory_levels")
      .where("inventory_item_id", "=", input.inventory_item_id)
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

    return this.db
      .insertInto("inventory_levels")
      .values(input)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
