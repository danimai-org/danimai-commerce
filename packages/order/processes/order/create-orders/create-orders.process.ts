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
  CreateOrdersSchema,
} from "./create-orders.schema";
import type { Database, Order } from "@danimai/order/db";

/**
 * Handles the create orders process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_ORDERS_PROCESS = Symbol("CreateOrders");

/**
 * Creates multiple orders in one execution.
 * Input: an array of order payloads; each payload may optionally provide `display_id`.
 * Output: created order rows in input order.
 */
@Process(CREATE_ORDERS_PROCESS)
export class CreateOrdersProcess
  implements ProcessContract<typeof CreateOrdersSchema, Order[]>
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
    @ProcessContext({ schema: CreateOrdersSchema })
    context: ProcessContextType<typeof CreateOrdersSchema>
  ) {
    const { input } = context;
    return this.db.transaction().execute(async (trx) => {
      // Allocate display ids from one max() read to avoid per-order max lookups.
      const row = await trx
        .selectFrom("orders")
        .select(({ fn }) => fn.max<number>("display_id").as("max_id"))
        .executeTakeFirst();
      let nextDisplayId = Number(row?.max_id ?? 0) + 1;

      const created: Order[] = [];
      for (const orderInput of input.orders) {
        this.logger.info("Creating order", { input: orderInput });
        const displayId = orderInput.display_id ?? nextDisplayId++;

        const row = await trx
          .insertInto("orders")
          .values({
            currency_code: orderInput.currency_code,
            status: orderInput.status ?? "pending",
            fulfillment_status: orderInput.fulfillment_status ?? "not_fulfilled",
            payment_status: orderInput.payment_status ?? "not_paid",
            display_id: displayId,
            email: orderInput.email ?? null,
            customer_id: orderInput.customer_id ?? null,
            sales_channel_id: orderInput.sales_channel_id ?? null,
            region_id: orderInput.region_id ?? null,
            cart_id: orderInput.cart_id ?? null,
            billing_address_id: orderInput.billing_address_id ?? null,
            shipping_address_id: orderInput.shipping_address_id ?? null,
            metadata: orderInput.metadata ?? null,
          })
          .returningAll()
          .executeTakeFirst();

        if (row) created.push(row);
      }

      return created;
    });
  }
}
