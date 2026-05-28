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
  type UpdateOrderProcessInput,
  UpdateOrderSchema,
} from "./update-orders.schema";
import type { Database, Order, OrderUpdate } from "@danimai/order/db";
import {
  hasOrdersCartIdColumn,
  toOrderApiRow,
} from "../order-response.util";

/**
 * Handles the update orders process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_ORDERS_PROCESS = Symbol("UpdateOrders");

@Process(UPDATE_ORDERS_PROCESS)
export class UpdateOrdersProcess
  implements ProcessContract<typeof UpdateOrderSchema, Order>
{
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
    @ProcessContext({ schema: UpdateOrderSchema })
    context: ProcessContextType<typeof UpdateOrderSchema>
  ) {
    const { input } = context;
    const existingOrder = await this.validateOrder(input);
    const updated = await this.updateOrder(input);

    if (existingOrder.status !== "canceled" && input.status === "canceled") {
      await this.restockCanceledOrderItems(input.id);
    }

    return updated;
  }

  async validateOrder(input: UpdateOrderProcessInput) {
    const row = await this.db
      .selectFrom("orders")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Order not found", [
        { type: "not_found", message: "Order not found", path: "id" },
      ]);
    }
    return row;
  }

  private async restockCanceledOrderItems(orderId: string) {
    const db = this.db as any;
    const orderLineItems = await db
      .selectFrom("order_line_items")
      .where("order_id", "=", orderId)
      .where("deleted_at", "is", null)
      .select(["variant_id", "quantity"])
      .execute();

    for (const lineItem of orderLineItems as Array<{ variant_id: string | null; quantity: number | null }>) {
      const quantity = Math.max(0, lineItem.quantity ?? 0);
      if (!lineItem.variant_id || quantity <= 0) continue;

      const variant = await db
        .selectFrom("product_variants")
        .where("id", "=", lineItem.variant_id)
        .where("deleted_at", "is", null)
        .select(["sku", "manage_inventory"])
        .executeTakeFirst();

      if (!variant || !variant.manage_inventory || !variant.sku) continue;

      const inventoryItem = await db
        .selectFrom("inventory_items")
        .where("sku", "=", variant.sku)
        .where("deleted_at", "is", null)
        .select(["id"])
        .executeTakeFirst();

      if (!inventoryItem) continue;

      const levels = await db
        .selectFrom("inventory_levels")
        .where("inventory_item_id", "=", inventoryItem.id)
        .where("deleted_at", "is", null)
        .select(["id", "stocked_quantity", "reserved_quantity"])
        .orderBy("updated_at", "asc")
        .execute();

      const primaryLevel = levels[0];
      if (!primaryLevel) continue;

      const nextStocked = primaryLevel.stocked_quantity + quantity;
      await db
        .updateTable("inventory_levels")
        .set({
          stocked_quantity: nextStocked,
          available_quantity: nextStocked - primaryLevel.reserved_quantity,
          updated_at: new Date(),
        })
        .where("id", "=", primaryLevel.id)
        .execute();
    }
  }

  async updateOrder(input: UpdateOrderProcessInput) {
    this.logger.info("Updating order", { input });
    const updateData: Partial<OrderUpdate> = {};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.fulfillment_status !== undefined)
      updateData.fulfillment_status = input.fulfillment_status;
    if (input.payment_status !== undefined)
      updateData.payment_status = input.payment_status;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.customer_id !== undefined) updateData.customer_id = input.customer_id;
    if (input.sales_channel_id !== undefined)
      updateData.sales_channel_id = input.sales_channel_id;
    if (input.region_id !== undefined) updateData.region_id = input.region_id;
    if (input.cart_id !== undefined) updateData.cart_id = input.cart_id;
    if (input.billing_address_id !== undefined)
      updateData.billing_address_id = input.billing_address_id;
    if (input.shipping_address_id !== undefined)
      updateData.shipping_address_id = input.shipping_address_id;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    const row = await this.db
      .updateTable("orders")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Order not found", [
        { type: "not_found", message: "Order not found", path: "id" },
      ]);
    }
    const hasCartIdColumn = await hasOrdersCartIdColumn(this.db);
    return toOrderApiRow(row, hasCartIdColumn);
  }
}
