import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateOrderProcessInput,
  CreateOrdersSchema,
} from "./create-orders.schema";
import type { Database, Order } from "@danimai/order/db";

export const CREATE_ORDERS_PROCESS = Symbol("CreateOrders");

@Process(CREATE_ORDERS_PROCESS)
export class CreateOrdersProcess implements ProcessContract<Order[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateOrdersSchema })
    context: ProcessContextType<typeof CreateOrdersSchema>
  ) {
    const { input } = context;
    const created: Order[] = [];
    for (const o of input.orders) {
      const row = await this.createOrder(o);
      if (row) created.push(row);
    }
    return created;
  }

  async getNextDisplayId(): Promise<number> {
    const row = await this.db
      .selectFrom("orders")
      .select(({ fn }) => fn.max<number>("display_id").as("max_id"))
      .executeTakeFirst();
    return (Number(row?.max_id ?? 0) + 1) as number;
  }

  async createOrder(input: CreateOrderProcessInput) {
    this.logger.info("Creating order", { input });
    const displayId =
      input.display_id ?? (await this.getNextDisplayId());
    return this.db
      .insertInto("orders")
      .values({
        currency_code: input.currency_code,
        status: input.status ?? "pending",
        fulfillment_status: input.fulfillment_status ?? "not_fulfilled",
        payment_status: input.payment_status ?? "not_paid",
        display_id: displayId,
        email: input.email ?? null,
        customer_id: input.customer_id ?? null,
        sales_channel_id: input.sales_channel_id ?? null,
        region_id: input.region_id ?? null,
        billing_address_id: input.billing_address_id ?? null,
        shipping_address_id: input.shipping_address_id ?? null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
