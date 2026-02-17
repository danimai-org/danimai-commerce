import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  type CreateInventoryItemsProcessInput,
  CreateInventoryItemsSchema,
} from "./create-inventory-items.schema";
import type { Database, InventoryItem } from "../../db/type";

export const CREATE_INVENTORY_ITEMS_PROCESS = Symbol("CreateInventoryItems");

@Process(CREATE_INVENTORY_ITEMS_PROCESS)
export class CreateInventoryItemsProcess implements ProcessContract<
  InventoryItem[]
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({
      schema: CreateInventoryItemsSchema,
    })
    context: ProcessContextType<typeof CreateInventoryItemsSchema>,
  ) {
    const { input } = context;
    const created: InventoryItem[] = [];
    for (const item of input.inventory_items) {
      const row = await this.createInventoryItem(item);
      if (row) created.push(row);
    }
    return created;
  }

  async createInventoryItem(input: {
    sku?: string | null;
    requires_shipping?: boolean;
  }) {
    this.logger.info("Creating inventory item", { input });
    return this.db
      .insertInto("inventory_items")
      .values({
        sku: input.sku ?? null,
        requires_shipping: input.requires_shipping ?? true,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
