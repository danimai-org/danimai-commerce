import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreatePaymentProcessOutput,
  CreatePaymentSchema,
} from "./create-payment.schema";
import type { Database } from "../../../db/type";

/**
 * Creates a payment record from order_id, customer_id, and provider_id.
 * Input: order_id, customer_id, provider_id.
 * Output: created payments row with amount and currency derived from the order.
 */
export const CREATE_PAYMENT_PROCESS = Symbol("CreatePayment");

@Process(CREATE_PAYMENT_PROCESS)
export class CreatePaymentProcess
  implements
    ProcessContract<typeof CreatePaymentSchema, CreatePaymentProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: CreatePaymentSchema })
    context: ProcessContextType<typeof CreatePaymentSchema>
  ) {
    const { input } = context;
    this.logger.info("Creating payment", {
      order_id: input.order_id,
      customer_id: input.customer_id,
      provider_id: input.provider_id,
    });

    const provider = await this.db
      .selectFrom("payment_providers")
      .where("id", "=", input.provider_id)
      .where("deleted_at", "is", null)
      .select(["id", "active"])
      .executeTakeFirst();

    if (!provider) {
      throw new NotFoundError("Payment provider not found");
    }

    if (!provider.active) {
      throw new ValidationError("Payment provider is inactive", [
        {
          type: "invalid",
          message: "Payment provider is inactive",
          path: "provider_id",
        },
      ]);
    }

    const order = await this.db
      .selectFrom("orders")
      .where("id", "=", input.order_id)
      .where("deleted_at", "is", null)
      .select(["id", "currency_code", "customer_id"])
      .executeTakeFirst();

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (
      order.customer_id != null &&
      order.customer_id !== input.customer_id
    ) {
      throw new ValidationError("Customer does not match order", [
        {
          type: "invalid",
          message: "Customer does not match order",
          path: "customer_id",
        },
      ]);
    }

    // Single aggregate: line-item subtotal matches order detail totals logic.
    const orderTotal = await this.db
      .selectFrom("orders")
      .leftJoin("order_line_items", (join) =>
        join
          .onRef("order_line_items.order_id", "=", "orders.id")
          .on("order_line_items.deleted_at", "is", null)
      )
      .where("orders.id", "=", input.order_id)
      .where("orders.deleted_at", "is", null)
      .select([
        "orders.currency_code",
        sql<string>`coalesce(sum(cast(order_line_items.unit_price as numeric) * order_line_items.quantity), 0)`.as(
          "amount"
        ),
      ])
      .groupBy(["orders.id", "orders.currency_code"])
      .executeTakeFirstOrThrow();

    const amount = String(orderTotal.amount);
    if (Number.parseFloat(amount) <= 0) {
      throw new ValidationError("Order has no payable amount", [
        {
          type: "invalid",
          message: "Order has no payable amount",
          path: "order_id",
        },
      ]);
    }

    return this.db
      .insertInto("payments")
      .values({
        order_id: input.order_id,
        customer_id: input.customer_id,
        provider_id: input.provider_id,
        amount,
        currency_code: orderTotal.currency_code,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
