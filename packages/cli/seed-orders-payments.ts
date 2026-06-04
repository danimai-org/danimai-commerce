#!/usr/bin/env bun

/**
 * Seed orders, payments, payment transactions, refunds, and Stripe-like refund reasons.
 * Usage: danimai seed-orders-payments [count]
 * Default count: 100. Requires DATABASE_URL and customer, order, payment migrations.
 */

import "reflect-metadata";
import { randomUUID } from "crypto";
import { initialize, getService, DANIMAI_DB } from "@danimai/core";
import type { Kysely } from "kysely";
import {
  CREATE_CUSTOMERS_PROCESS,
  type CreateCustomersProcess,
} from "@danimai/customer";
import {
  CREATE_ORDERS_PROCESS,
  type CreateOrdersProcess,
} from "@danimai/order";
import {
  CREATE_PAYMENT_PROCESS,
  type CreatePaymentProcess,
} from "@danimai/payment";
import type { Database, PaymentStatus } from "@danimai/payment";
import { getLogger } from "../../backend/logger";

const DEFAULT_COUNT = 100;
const MAX_COUNT = 10_000;
const BATCH_SIZE = 100;

const STRIPE_REFUND_REASONS = [
  { value: "duplicate", label: "Duplicate" },
  { value: "fraudulent", label: "Fraudulent" },
  { value: "requested_by_customer", label: "Requested by customer" },
] as const;

type OrderPaymentStatus =
  | "not_paid"
  | "awaiting"
  | "captured"
  | "partially_refunded"
  | "refunded"
  | "canceled"
  | "requires_action";

function getInitConfig() {
  const logger = getLogger();
  return {
    db: { url: process.env.DATABASE_URL || "" },
    logger,
    config: {
      stripeKey: process.env.STRIPE_KEY || "",
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
      defaultCurrency: process.env.DEFAULT_CURRENCY || "USD",
      email: {
        resendApiKey: process.env.RESEND_API_KEY || "",
        from: process.env.EMAIL_FROM || "",
        templateFolder: process.env.EMAIL_TEMPLATE_FOLDER || "",
      },
      jwt: { secret: process.env.JWT_SECRET || "" },
    },
  };
}

function parseCount(args: string[]): number {
  return Math.min(
    Math.max(1, parseInt(args[0] ?? String(DEFAULT_COUNT), 10) || DEFAULT_COUNT),
    MAX_COUNT,
  );
}

function txnStatusForIndex(index: number, count: number): PaymentStatus {
  const failedUntil = Math.floor(count * 0.05);
  const pendingUntil = failedUntil + Math.floor(count * 0.05);
  if (index < failedUntil) return "failed";
  if (index < pendingUntil) return "pending";
  return "succeeded";
}

function orderPaymentStatus(
  txnStatus: PaymentStatus,
  refunded: boolean,
): OrderPaymentStatus {
  if (refunded) return "refunded";
  switch (txnStatus) {
    case "succeeded":
      return "captured";
    case "pending":
      return "awaiting";
    case "failed":
    case "cancelled":
      return "not_paid";
    default:
      return "not_paid";
  }
}

async function ensureRefundReasons(
  db: Kysely<Database>,
): Promise<Map<string, string>> {
  const byValue = new Map<string, string>();
  for (const { value, label } of STRIPE_REFUND_REASONS) {
    const existing = await db
      .selectFrom("refund_reasons")
      .where("value", "=", value)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();
    if (existing) {
      byValue.set(value, existing.id);
      continue;
    }
    const id = randomUUID();
    await db
      .insertInto("refund_reasons")
      .values({ id, label, value, metadata: null })
      .execute();
    byValue.set(value, id);
  }
  return byValue;
}

async function ensureStripeProviderId(db: Kysely<Database>): Promise<string> {
  const row = await db
    .selectFrom("payment_providers")
    .where("name", "=", "stripe")
    .where("deleted_at", "is", null)
    .select("id")
    .executeTakeFirst();
  if (row) return row.id;

  const inserted = await db
    .insertInto("payment_providers")
    .values({ name: "stripe", metadata: null, active: true })
    .returning("id")
    .executeTakeFirstOrThrow();
  return inserted.id;
}

function randomUnitPrice(): number {
  return Math.floor(Math.random() * 491) + 10;
}

async function runSeedOrdersPayments() {
  const count = parseCount(process.argv.slice(2));
  const currency = process.env.DEFAULT_CURRENCY || "USD";
  const refundCount = Math.floor(count * 0.1);
  const succeededStart = Math.floor(count * 0.05) + Math.floor(count * 0.05);

  const logger = getLogger();
  logger.info(`Starting seed: ${count} orders/payments`);

  try {
    initialize(getInitConfig());
    const db = getService<Kysely<Database>>(DANIMAI_DB);

    const createCustomers = getService<CreateCustomersProcess>(
      CREATE_CUSTOMERS_PROCESS,
    );
    const createOrders = getService<CreateOrdersProcess>(CREATE_ORDERS_PROCESS);
    const createPayment = getService<CreatePaymentProcess>(CREATE_PAYMENT_PROCESS);

    await ensureRefundReasons(db);
    const refundReasonIds = (
      await db
        .selectFrom("refund_reasons")
        .where("deleted_at", "is", null)
        .select("id")
        .execute()
    ).map((r) => r.id);

    const stripeProviderId = await ensureStripeProviderId(db);

    const customers: Array<{ id: string; email: string }> = [];
    for (let offset = 0; offset < count; offset += BATCH_SIZE) {
      const batchCount = Math.min(BATCH_SIZE, count - offset);
      const batch = await createCustomers.runOperations({
        input: {
          customers: Array.from({ length: batchCount }, (_, i) => {
            const n = offset + i + 1;
            return {
              email: `seed-order-${n}@example.com`,
              first_name: "Seed",
              last_name: `Customer ${n}`,
              has_account: true,
              active: true,
            };
          }),
        },
      });
      for (const c of batch) {
        customers.push({ id: c.id, email: c.email });
      }
    }

    const orders: Array<{ id: string; customer_id: string }> = [];
    for (let offset = 0; offset < count; offset += BATCH_SIZE) {
      const batchCount = Math.min(BATCH_SIZE, count - offset);
      const batch = await createOrders.runOperations({
        input: {
          orders: Array.from({ length: batchCount }, (_, i) => {
            const customer = customers[offset + i]!;
            const unitPrice = randomUnitPrice();
            return {
              currency_code: currency,
              status: "completed" as const,
              fulfillment_status: "not_fulfilled" as const,
              payment_status: "not_paid" as const,
              email: customer.email,
              customer_id: customer.id,
              metadata: {
                items: [
                  {
                    title: `Seed item ${offset + i + 1}`,
                    unit_price: String(unitPrice),
                    quantity: 1,
                  },
                ],
              },
            };
          }),
        },
      });
      for (let j = 0; j < batch.length; j++) {
        orders.push({
          id: batch[j]!.id,
          customer_id: customers[offset + j]!.id,
        });
      }
    }

    const payments: Array<{
      id: string;
      order_id: string;
      customer_id: string;
      amount: string;
      currency_code: string;
      index: number;
    }> = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]!;
      const payment = await createPayment.runOperations({
        input: {
          order_id: order.id,
          customer_id: order.customer_id,
          provider_id: stripeProviderId,
        },
      });
      payments.push({
        id: payment.id,
        order_id: order.id,
        customer_id: order.customer_id,
        amount: String(payment.amount),
        currency_code: payment.currency_code,
        index: i,
      });
    }

    let failedTxns = 0;
    let pendingTxns = 0;
    let succeededTxns = 0;
    let refundsCreated = 0;

    await db.transaction().execute(async (trx) => {
      for (const payment of payments) {
        const txnStatus = txnStatusForIndex(payment.index, count);
        const txnId = randomUUID();
        const refunded =
          txnStatus === "succeeded" &&
          payment.index >= succeededStart &&
          payment.index < succeededStart + refundCount;

        await trx
          .insertInto("payment_transactions")
          .values({
            id: txnId,
            payment_id: payment.id,
            provider_id: stripeProviderId,
            amount: payment.amount,
            currency_code: payment.currency_code,
            last_status: txnStatus,
            metadata: { provider: "stripe", seed: true },
            payment_intent_id: `pi_seed_${randomUUID()}`,
            checkout_id: `cs_seed_${randomUUID()}`,
            customer_id: payment.customer_id,
          })
          .execute();

        await trx
          .updateTable("payments")
          .set({
            last_transaction_id: txnId,
            last_status: txnStatus,
            success_transaction_id:
              txnStatus === "succeeded" ? txnId : null,
            updated_at: new Date(),
          })
          .where("id", "=", payment.id)
          .execute();

        if (txnStatus === "failed") failedTxns++;
        else if (txnStatus === "pending") pendingTxns++;
        else succeededTxns++;

        await trx
          .updateTable("orders")
          .set({
            payment_status: orderPaymentStatus(txnStatus, refunded),
            updated_at: new Date(),
          })
          .where("id", "=", payment.order_id)
          .execute();

        if (refunded && refundReasonIds.length > 0) {
          const reasonId =
            refundReasonIds[
              Math.floor(Math.random() * refundReasonIds.length)
            ]!;
          await trx
            .insertInto("refunds")
            .values({
              id: randomUUID(),
              customer_id: payment.customer_id,
              payment_id: payment.id,
              payment_transaction_id: txnId,
              amount: payment.amount,
              refund_reason_id: reasonId,
              last_status: "succeeded",
              stripe_refund_id: `re_seed_${randomUUID()}`,
              created_by: "seed",
              metadata: { provider: "stripe", seed: true },
            })
            .execute();
          refundsCreated++;
        }
      }
    });

    logger.info("Seed complete", {
      orders: orders.length,
      payments: payments.length,
      transactions: payments.length,
      failedTxns,
      pendingTxns,
      succeededTxns,
      refunds: refundsCreated,
      refundReasons: STRIPE_REFUND_REASONS.length,
    });

    console.log(
      `Seed complete: ${orders.length} orders, ${payments.length} payments, ` +
        `${payments.length} transactions (${failedTxns} failed, ${pendingTxns} pending, ${succeededTxns} succeeded), ` +
        `${refundsCreated} refunds, ${STRIPE_REFUND_REASONS.length} refund reasons.`,
    );

    await db.destroy();
    process.exit(0);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Seed failed:", msg);
    if (err instanceof Error && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runSeedOrdersPayments();
