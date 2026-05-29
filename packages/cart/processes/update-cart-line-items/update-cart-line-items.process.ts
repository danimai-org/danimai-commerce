import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  ValidationError,
  jsonb,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { randomUUID } from "node:crypto";
import { Kysely, sql } from "kysely";
import type { Database } from "@danimai/cart/db";
import { loadCartWithRelations } from "../retrieve-cart/retrieve-cart.process";
import {
  type UpdateCartLineItemsProcessOutput,
  UpdateCartLineItemsSchema,
  type UpdateCartLineItemsProcessInput,
} from "./update-cart-line-items.schema";

/**
 * Handles the update cart line items process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_CART_LINE_ITEMS_PROCESS = Symbol("UpdateCartLineItems");

type LineItemIn = UpdateCartLineItemsProcessInput["line_items"][number];
type VariantInventoryInfo = {
  id: string;
  sku: string | null;
  manage_inventory: boolean;
  allow_backorder: boolean;
};

/**
 * Helper: lineItemPatch.
 * Input: function parameters for query/shape logic.
 * Output: derived data used by the process flow.
 */
function lineItemPatch(row: LineItemIn): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (row.title !== undefined) patch.title = row.title;
  if (row.description !== undefined) patch.description = row.description;
  if (row.thumbnail !== undefined) patch.thumbnail = row.thumbnail;
  if (row.variant_id !== undefined) patch.variant_id = row.variant_id;
  if (row.product_id !== undefined) patch.product_id = row.product_id;
  if (row.quantity !== undefined) patch.quantity = row.quantity;
  if (row.unit_price !== undefined) patch.unit_price = row.unit_price;
  if (row.metadata !== undefined) patch.metadata = jsonb(row.metadata);
  return patch;
}

@Process(UPDATE_CART_LINE_ITEMS_PROCESS)
export class UpdateCartLineItemsProcess
  implements
    ProcessContract<typeof UpdateCartLineItemsSchema, UpdateCartLineItemsProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) {}

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: UpdateCartLineItemsSchema })
    context: ProcessContextType<typeof UpdateCartLineItemsSchema>
  ) {
    const { input } = context;
    const cart = await this.db
      .selectFrom("carts")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!cart) {
      throw new NotFoundError("Cart not found");
    }
    if (cart.completed_at != null) {
      throw new ValidationError("Cart is completed", [
        {
          type: "invalid_state",
          message: "Cannot modify line items on a completed cart",
          path: "id",
        },
      ]);
    }

    const keptIds = new Set(
      input.line_items.filter((i) => i.id != null && i.id !== "").map((i) => i.id!)
    );

    // Neon serverless: no Kysely interactive transactions.
    const db = this.db;

    for (const item of input.line_items) {
      if (!item.id) continue;
      const existing = await db
        .selectFrom("cart_line_items")
        .where("id", "=", item.id)
        .where("cart_id", "=", input.id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();
      if (!existing) {
        throw new ValidationError("Line item not found on this cart", [
          {
            type: "not_found",
            message: "Line item not found on this cart",
            path: "line_items",
          },
        ]);
      }
    }

    if (keptIds.size === 0) {
      await db
        .updateTable("cart_line_items")
        .set({ deleted_at: sql<Date>`now()`, updated_at: sql<Date>`now()` })
        .where("cart_id", "=", input.id)
        .where("deleted_at", "is", null)
        .execute();
    } else {
      await db
        .updateTable("cart_line_items")
        .set({ deleted_at: sql<Date>`now()`, updated_at: sql<Date>`now()` })
        .where("cart_id", "=", input.id)
        .where("deleted_at", "is", null)
        .where("id", "not in", [...keptIds])
        .execute();
    }

    for (const item of input.line_items) {
      if (item.id) {
        const patch = lineItemPatch(item);
        if (Object.keys(patch).length > 0) {
          await db
            .updateTable("cart_line_items")
            .set({
              ...patch,
              updated_at: sql<Date>`now()`,
            } as never)
            .where("id", "=", item.id)
            .execute();
        }
      } else {
        const hasTitle = item.title != null && item.title !== "";
        const hasVariant = item.variant_id != null && item.variant_id !== "";
        if (!hasTitle && !hasVariant) {
          throw new ValidationError(
            "New line items require title or variant_id",
            [
              {
                type: "invalid",
                message: "New line items require title or variant_id",
                path: "line_items",
              },
            ]
          );
        }
        await db
          .insertInto("cart_line_items")
          .values({
            cart_id: input.id,
            title: item.title ?? null,
            description: item.description ?? null,
            thumbnail: item.thumbnail ?? null,
            variant_id: item.variant_id ?? null,
            product_id: item.product_id ?? null,
            quantity: item.quantity ?? null,
            unit_price: item.unit_price ?? null,
            metadata: jsonb(item.metadata),
          })
          .execute();
      }
    }

    await db
      .updateTable("carts")
      .set({ updated_at: sql<Date>`now()` })
      .where("id", "=", input.id)
      .execute();

    await this.syncCartInventoryReservations(db, input.id);

    return loadCartWithRelations(this.db, input.id);
  }

  private async syncCartInventoryReservations(db: Kysely<Database>, cartId: string) {
    const rawDb = db as any;
    const cartLineItems = await db
      .selectFrom("cart_line_items")
      .where("cart_id", "=", cartId)
      .where("deleted_at", "is", null)
      .select(["id", "variant_id", "quantity"])
      .execute();

    const activeLineIds = cartLineItems.map((line) => line.id);

    const staleReservations = await rawDb
      .selectFrom("reservation_items")
      .where(sql`metadata->>'cart_id'`, "=", cartId)
      .where("deleted_at", "is", null)
      .select(["id", "line_item_id", "quantity", "inventory_item_id", "location_id"])
      .execute();

    const staleRows = staleReservations.filter((row: { line_item_id: string | null }) =>
      row.line_item_id == null ? true : !activeLineIds.includes(row.line_item_id)
    );
    await this.releaseReservations(rawDb, staleRows);

    for (const line of cartLineItems) {
      const quantity = Math.max(0, line.quantity ?? 0);
      const variantId = line.variant_id;
      if (!variantId || quantity === 0) {
        const existingForLine = staleReservations.filter(
          (row: { line_item_id: string | null }) => row.line_item_id === line.id
        );
        await this.releaseReservations(rawDb, existingForLine);
        continue;
      }

      const variant = await this.getVariantInventoryInfo(rawDb, variantId);
      if (!variant || !variant.manage_inventory || !variant.sku) {
        const existingForLine = staleReservations.filter(
          (row: { line_item_id: string | null }) => row.line_item_id === line.id
        );
        await this.releaseReservations(rawDb, existingForLine);
        continue;
      }

      const inventoryItem = await this.ensureInventoryItemForSku(rawDb, variant.sku);

      const levels = await rawDb
        .selectFrom("inventory_levels")
        .where("inventory_item_id", "=", inventoryItem.id)
        .where("deleted_at", "is", null)
        .select(["id", "location_id", "available_quantity", "reserved_quantity"])
        .orderBy("available_quantity", "desc")
        .execute();

      if (levels.length === 0) {
        const existingForLine = staleReservations.filter(
          (row: { line_item_id: string | null }) => row.line_item_id === line.id
        );
        await this.releaseReservations(rawDb, existingForLine);
        continue;
      }

      const totalAvailable = levels.reduce(
        (sum: number, level: { available_quantity: number }) => sum + Math.max(0, level.available_quantity),
        0
      );

      if (!variant.allow_backorder && totalAvailable < quantity) {
        throw new ValidationError("Insufficient inventory for cart line item", [
          {
            type: "invalid",
            message: "Requested quantity exceeds available inventory",
            path: "line_items",
          },
        ]);
      }

      const reservationsForLine = await rawDb
        .selectFrom("reservation_items")
        .where("line_item_id", "=", line.id)
        .where("inventory_item_id", "=", inventoryItem.id)
        .where("deleted_at", "is", null)
        .select(["id", "quantity", "location_id", "inventory_item_id", "line_item_id"])
        .execute();

      const reservedNow = reservationsForLine.reduce(
        (sum: number, row: { quantity: number }) => sum + row.quantity,
        0
      );

      const targetReserved = Math.min(quantity, totalAvailable);
      if (reservedNow > targetReserved) {
        await this.releaseReservationQuantity(rawDb, reservationsForLine, reservedNow - targetReserved);
      } else if (targetReserved > reservedNow) {
        await this.reserveFromLevels(
          rawDb,
          levels,
          inventoryItem.id,
          line.id,
          cartId,
          targetReserved - reservedNow
        );
      }
    }
  }

  private async ensureInventoryItemForSku(
    rawDb: any,
    sku: string
  ): Promise<{ id: string }> {
    const normalizedSku = sku.trim();
    const existing = await rawDb
      .selectFrom("inventory_items")
      .where("sku", "=", normalizedSku)
      .where("deleted_at", "is", null)
      .select(["id"])
      .executeTakeFirst();

    if (existing) {
      return existing;
    }

    const id = randomUUID();
    await rawDb
      .insertInto("inventory_items")
      .values({
        id,
        sku: normalizedSku,
        requires_shipping: true,
        metadata: null,
      })
      .execute();

    return { id };
  }

  private async getVariantInventoryInfo(rawDb: any, variantId: string): Promise<VariantInventoryInfo | null> {
    return rawDb
      .selectFrom("product_variants")
      .where("id", "=", variantId)
      .where("deleted_at", "is", null)
      .select(["id", "sku", "manage_inventory", "allow_backorder"])
      .executeTakeFirst();
  }

  private async reserveFromLevels(
    rawDb: any,
    levels: Array<{ id: string; location_id: string; available_quantity: number; reserved_quantity: number }>,
    inventoryItemId: string,
    lineItemId: string,
    cartId: string,
    quantity: number
  ) {
    let remaining = quantity;
    for (const level of levels) {
      if (remaining <= 0) break;
      const canReserve = Math.min(remaining, Math.max(0, level.available_quantity));
      if (canReserve <= 0) continue;

      await rawDb
        .insertInto("reservation_items")
        .values({
          inventory_item_id: inventoryItemId,
          location_id: level.location_id,
          quantity: canReserve,
          line_item_id: lineItemId,
          description: "cart_reservation",
          metadata: jsonb({ source: "cart", cart_id: cartId }),
        })
        .execute();

      await rawDb
        .updateTable("inventory_levels")
        .set({
          reserved_quantity: level.reserved_quantity + canReserve,
          available_quantity: level.available_quantity - canReserve,
          updated_at: new Date(),
        })
        .where("id", "=", level.id)
        .execute();

      level.reserved_quantity += canReserve;
      level.available_quantity -= canReserve;
      remaining -= canReserve;
    }
  }

  private async releaseReservationQuantity(
    rawDb: any,
    rows: Array<{ id: string; quantity: number; location_id: string; inventory_item_id: string; line_item_id: string | null }>,
    quantityToRelease: number
  ) {
    let remaining = quantityToRelease;
    for (const row of rows) {
      if (remaining <= 0) break;
      const releaseQty = Math.min(remaining, row.quantity);

      const level = await rawDb
        .selectFrom("inventory_levels")
        .where("inventory_item_id", "=", row.inventory_item_id)
        .where("location_id", "=", row.location_id)
        .where("deleted_at", "is", null)
        .select(["id", "available_quantity", "reserved_quantity"])
        .executeTakeFirst();

      if (level) {
        await rawDb
          .updateTable("inventory_levels")
          .set({
            reserved_quantity: Math.max(0, level.reserved_quantity - releaseQty),
            available_quantity: level.available_quantity + releaseQty,
            updated_at: new Date(),
          })
          .where("id", "=", level.id)
          .execute();
      }

      if (releaseQty === row.quantity) {
        await rawDb
          .updateTable("reservation_items")
          .set({ deleted_at: new Date(), updated_at: new Date() })
          .where("id", "=", row.id)
          .where("deleted_at", "is", null)
          .execute();
      } else {
        await rawDb
          .updateTable("reservation_items")
          .set({ quantity: row.quantity - releaseQty, updated_at: new Date() })
          .where("id", "=", row.id)
          .where("deleted_at", "is", null)
          .execute();
      }

      remaining -= releaseQty;
    }
  }

  private async releaseReservations(
    rawDb: any,
    rows: Array<{ id: string; quantity: number; inventory_item_id: string; location_id: string; line_item_id: string | null }>
  ) {
    if (rows.length === 0) return;
    const total = rows.reduce((sum, row) => sum + row.quantity, 0);
    await this.releaseReservationQuantity(rawDb, rows, total);
  }
}
