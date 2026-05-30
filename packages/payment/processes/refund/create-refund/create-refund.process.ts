import {
  InjectDB,
  InjectLogger,
  InjectStripe,
  NotFoundError,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import type Stripe from "stripe";
import {
  type CreateRefundProcessOutput,
  CreateRefundSchema,
} from "./create-refund.schema";
import type { Database, PaymentStatus } from "../../../db/type";

/** Converts decimal amount string to Stripe smallest-currency-unit integer. */
function toStripeUnitAmount(amount: string): number {
  return Math.round(Number.parseFloat(amount) * 100);
}

/** Stripe metadata values must be strings. */
function toStripeMetadata(
  metadata: Record<string, unknown> | null | undefined
): Record<string, string> {
  if (!metadata) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== null && value !== undefined) {
      result[key] = String(value);
    }
  }
  return result;
}

/** Maps Stripe Refund status to local refund status. */
function mapStripeRefundStatus(status: Stripe.Refund.Status): PaymentStatus {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "failed":
      return "failed";
    case "canceled":
      return "cancelled";
    default:
      return "pending";
  }
}

/**
 * Creates a refund in DB, initiates Stripe refund with refund_id metadata, then updates DB.
 * Input: payment_transaction_id, amount, optional refund_reason_id, created_by, metadata.
 * Output: updated refunds row with stripe_refund_id and mapped status.
 */
export const CREATE_REFUND_PROCESS = Symbol("CreateRefund");

@Process(CREATE_REFUND_PROCESS)
export class CreateRefundProcess
  implements
    ProcessContract<typeof CreateRefundSchema, CreateRefundProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
    @InjectStripe()
    private readonly stripe: Stripe
  ) {}

  async runOperations(
    @ProcessContext({ schema: CreateRefundSchema })
    context: ProcessContextType<typeof CreateRefundSchema>
  ) {
    const { input } = context;
    const amount = String(input.amount);

    const transaction = await this.db
      .selectFrom("payment_transactions")
      .where("id", "=", input.payment_transaction_id)
      .where("deleted_at", "is", null)
      .select([
        "id",
        "payment_id",
        "customer_id",
        "provider_id",
        "amount",
        "last_status",
        "payment_intent_id",
      ])
      .executeTakeFirst();

    if (!transaction) {
      throw new NotFoundError("Payment transaction not found");
    }

    const paymentId = transaction.payment_id;
    const customerId = transaction.customer_id;

    this.logger.info("Creating refund", {
      payment_id: paymentId,
      payment_transaction_id: input.payment_transaction_id,
      customer_id: customerId,
    });

    if (Number.parseFloat(amount) <= 0) {
      throw new ValidationError("Refund amount must be greater than zero", [
        {
          type: "invalid",
          message: "Refund amount must be greater than zero",
          path: "amount",
        },
      ]);
    }

    const payment = await this.db
      .selectFrom("payments")
      .where("id", "=", paymentId)
      .where("deleted_at", "is", null)
      .select(["id", "customer_id", "provider_id"])
      .executeTakeFirst();

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.customer_id !== customerId) {
      throw new ValidationError("Customer does not match payment", [
        {
          type: "invalid",
          message: "Customer does not match payment",
          path: "payment_transaction_id",
        },
      ]);
    }

    if (transaction.last_status !== "succeeded") {
      throw new ValidationError("Payment transaction is not succeeded", [
        {
          type: "invalid",
          message: "Payment transaction is not succeeded",
          path: "payment_transaction_id",
        },
      ]);
    }

    if (!transaction.payment_intent_id) {
      throw new ValidationError("Payment intent not found for transaction", [
        {
          type: "invalid",
          message: "Payment intent not found for transaction",
          path: "payment_transaction_id",
        },
      ]);
    }

    if (Number.parseFloat(amount) > Number.parseFloat(String(transaction.amount))) {
      throw new ValidationError("Refund amount exceeds transaction amount", [
        {
          type: "invalid",
          message: "Refund amount exceeds transaction amount",
          path: "amount",
        },
      ]);
    }

    const provider = await this.db
      .selectFrom("payment_providers")
      .where("id", "=", payment.provider_id)
      .where("deleted_at", "is", null)
      .select(["id", "active", "name"])
      .executeTakeFirst();

    if (!provider) {
      throw new NotFoundError("Payment provider not found");
    }

    if (!provider.active) {
      throw new ValidationError("Payment provider is inactive", [
        {
          type: "invalid",
          message: "Payment provider is inactive",
          path: "payment_transaction_id",
        },
      ]);
    }

    if (provider.name !== "stripe") {
      throw new ValidationError("Only Stripe provider is supported", [
        {
          type: "invalid",
          message: "Only Stripe provider is supported",
          path: "payment_transaction_id",
        },
      ]);
    }

    if (input.refund_reason_id) {
      const refundReason = await this.db
        .selectFrom("refund_reasons")
        .where("id", "=", input.refund_reason_id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (!refundReason) {
        throw new ValidationError("Refund reason not found", [
          {
            type: "not_found",
            message: "Refund reason not found",
            path: "refund_reason_id",
          },
        ]);
      }
    }

    const refund = await this.db
      .insertInto("refunds")
      .values({
        customer_id: customerId,
        payment_id: paymentId,
        payment_transaction_id: input.payment_transaction_id,
        amount,
        refund_reason_id: input.refund_reason_id ?? null,
        created_by: input.created_by ?? null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const stripeMetadata = toStripeMetadata({
      refund_id: refund.id,
      payment_id: paymentId,
      payment_transaction_id: input.payment_transaction_id,
      ...(input.metadata ?? {}),
    });

    const stripeRefund = await this.stripe.refunds.create({
      payment_intent: transaction.payment_intent_id,
      amount: toStripeUnitAmount(amount),
      metadata: stripeMetadata,
    });

    return this.db
      .updateTable("refunds")
      .set({
        stripe_refund_id: stripeRefund.id,
        last_status: mapStripeRefundStatus(stripeRefund.status),
        metadata: {
          ...(input.metadata && typeof input.metadata === "object"
            ? input.metadata
            : {}),
          stripe_refund: stripeRefund,
        },
        updated_at: sql`now()`,
      })
      .where("id", "=", refund.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
