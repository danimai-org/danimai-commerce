import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely } from "kysely";
import type { Database } from "../../../db";
import {
  CreateInventoryItemSchema,
  type CreateInventoryItemProcessOutput,
} from "./create-inventory-item.schema";

/**
 * Handles the create inventory item process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_INVENTORY_ITEM_PROCESS = Symbol("CreateInventoryItem");

@Process(CREATE_INVENTORY_ITEM_PROCESS)
export class CreateInventoryItemProcess
  implements ProcessContract<
    typeof CreateInventoryItemSchema,
    CreateInventoryItemProcessOutput
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
    @ProcessContext({ schema: CreateInventoryItemSchema })
    context: ProcessContextType<typeof CreateInventoryItemSchema>
  ) {
    const { input } = context;
    this.logger.info("Creating inventory item", { input });

    return this.db
      .insertInto("inventory_items")
      .values({
        sku: input.sku,
        requires_shipping: input.requires_shipping ?? false,
        metadata: input.metadata,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
