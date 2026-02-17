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
  type GetInventoryItemProcessInput,
  GetInventoryItemSchema,
} from "./get-inventory-item.schema";
import type {
  Database,
  InventoryItem,
  InventoryLevel,
  ReservationItem,
} from "../../db/type";

export type GetInventoryItemResult = {
  item: InventoryItem;
  levels: InventoryLevel[];
  reservations: ReservationItem[];
};

export const GET_INVENTORY_ITEM_PROCESS = Symbol("GetInventoryItem");

@Process(GET_INVENTORY_ITEM_PROCESS)
export class GetInventoryItemProcess implements ProcessContract<GetInventoryItemResult | null> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({
      schema: GetInventoryItemSchema,
    })
    context: ProcessContextType<typeof GetInventoryItemSchema>,
  ) {
    const { input } = context;
    return this.getInventoryItem(input.id);
  }

  async getInventoryItem(id: string): Promise<GetInventoryItemResult | null> {
    this.logger.info("Getting inventory item", { id });

    const item = await this.db
      .selectFrom("inventory_items")
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!item) {
      throw new ValidationError("Inventory item not found", [
        {
          type: "not_found",
          message: "Inventory item not found",
          path: "id",
        },
      ]);
    }

    const levels = await this.db
      .selectFrom("inventory_levels")
      .where("inventory_item_id", "=", id)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const reservations = await this.db
      .selectFrom("reservation_items")
      .where("inventory_item_id", "=", id)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    return {
      item,
      levels,
      reservations,
    };
  }
}
