import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Database } from "../../../db";
import {
  RetrieveInventoryItemSchema,
  type RetrieveInventoryItemProcessOutput,
} from "./retrieve-inventory-item.schema";

/**
 * Handles the retrieve inventory item process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_INVENTORY_ITEM_PROCESS = Symbol("RetrieveInventoryItem");

@Process(RETRIEVE_INVENTORY_ITEM_PROCESS)
export class RetrieveInventoryItemProcess
  implements ProcessContract<typeof RetrieveInventoryItemSchema, RetrieveInventoryItemProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: RetrieveInventoryItemSchema })
    context: ProcessContextType<typeof RetrieveInventoryItemSchema>
  ) {
    const { input } = context;

    const item = await this.db
      .selectFrom("inventory_items")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirstOrThrow();

    if (!item) {
      throw new NotFoundError("Inventory item not found");
    }

    const inventoryLevels = await this.db
      .selectFrom("inventory_levels")
      .where("inventory_item_id", "=", item.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const reservationItems = await this.db
      .selectFrom("reservation_items")
      .where("inventory_item_id", "=", item.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const associatedVariants =
      item.sku && item.sku.trim().length > 0
        ? await (this.db as any)
            .selectFrom("product_variants")
            .where("sku", "=", item.sku)
            .where("deleted_at", "is", null)
            .select(["id", "title", "sku", "product_id", "thumbnail"])
            .execute()
        : [];

    const productIds = [
      ...new Set(
        (associatedVariants as Array<{ product_id: string | null }>)
          .map((variant) => variant.product_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      ),
    ];
    const productRows =
      productIds.length > 0
        ? await (this.db as any)
            .selectFrom("products")
            .where("id", "in", productIds)
            .where("deleted_at", "is", null)
            .select(["id", "title", "thumbnail"])
            .execute()
        : [];
    const productSummaries = Object.fromEntries(
      (productRows as Array<{ id: string; title: string | null; thumbnail: string | null }>).map((product) => [
        product.id,
        {
          id: product.id,
          title: product.title,
          thumbnail: product.thumbnail,
        },
      ])
    );

    return {
      ...item,
      inventory_levels: inventoryLevels,
      reservation_items: reservationItems,
      associated_variants: associatedVariants,
      product_summaries: productSummaries,
    };
  }
}
