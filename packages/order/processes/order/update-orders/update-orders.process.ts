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

export const UPDATE_ORDERS_PROCESS = Symbol("UpdateOrders");

@Process(UPDATE_ORDERS_PROCESS)
export class UpdateOrdersProcess implements ProcessContract<Order | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: UpdateOrderSchema })
    context: ProcessContextType<typeof UpdateOrderSchema>
  ) {
    const { input } = context;
    await this.validateOrder(input);
    return this.updateOrder(input);
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
    if (input.billing_address_id !== undefined)
      updateData.billing_address_id = input.billing_address_id;
    if (input.shipping_address_id !== undefined)
      updateData.shipping_address_id = input.shipping_address_id;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    return this.db
      .updateTable("orders")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
