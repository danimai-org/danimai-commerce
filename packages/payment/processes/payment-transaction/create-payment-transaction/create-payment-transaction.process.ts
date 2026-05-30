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
  type CreatePaymentTransactionProcessOutput,
  CreatePaymentTransactionSchema,
} from "./create-payment-transaction.schema";
import type { Database } from "../../../db/type";

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

/**
 * Creates a payment transaction from a payment and initiates Stripe Checkout.
 * Input: payment_id, optional metadata, success_url, cancel_url.
 * Output: created payment_transactions row with checkout_url.
 */
export const CREATE_PAYMENT_TRANSACTION_PROCESS = Symbol(
  "CreatePaymentTransaction"
);

@Process(CREATE_PAYMENT_TRANSACTION_PROCESS)
export class CreatePaymentTransactionProcess
  implements
    ProcessContract<
      typeof CreatePaymentTransactionSchema,
      CreatePaymentTransactionProcessOutput
    >
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
    @ProcessContext({ schema: CreatePaymentTransactionSchema })
    context: ProcessContextType<typeof CreatePaymentTransactionSchema>
  ) {
    const { input } = context;
    this.logger.info("Creating payment transaction", {
      payment_id: input.payment_id,
    });

    const payment = await this.db
      .selectFrom("payments")
      .where("id", "=", input.payment_id)
      .where("deleted_at", "is", null)
      .select([
        "id",
        "customer_id",
        "provider_id",
        "amount",
        "currency_code",
      ])
      .executeTakeFirst();

    if (!payment) {
      throw new NotFoundError("Payment not found");
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
          path: "payment_id",
        },
      ]);
    }

    if (provider.name !== "stripe") {
      throw new ValidationError("Only Stripe provider is supported", [
        {
          type: "invalid",
          message: "Only Stripe provider is supported",
          path: "payment_id",
        },
      ]);
    }

    const paymentCustomer = await this.db
      .selectFrom("payment_customers")
      .where("customer_id", "=", payment.customer_id)
      .where("provider_id", "=", payment.provider_id)
      .where("deleted_at", "is", null)
      .select(["stripe_customer_id"])
      .executeTakeFirst();

    if (!paymentCustomer) {
      throw new ValidationError("Payment customer not found for provider", [
        {
          type: "not_found",
          message: "Payment customer not found for provider",
          path: "payment_id",
        },
      ]);
    }

    const transaction = await this.db
      .insertInto("payment_transactions")
      .values({
        payment_id: payment.id,
        provider_id: payment.provider_id,
        amount: payment.amount,
        currency_code: payment.currency_code,
        customer_id: payment.customer_id,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const stripeMetadata = toStripeMetadata({
      payment_transaction_id: transaction.id,
      payment_id: payment.id,
      ...(input.metadata ?? {}),
    });

    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      customer: paymentCustomer.stripe_customer_id,
      success_url: input.success_url,
      cancel_url: input.cancel_url,
      line_items: [
        {
          price_data: {
            currency: payment.currency_code.toLowerCase(),
            unit_amount: toStripeUnitAmount(String(payment.amount)),
            product_data: {
              name: "Payment",
            },
          },
          quantity: 1,
        },
      ],
      metadata: stripeMetadata,
      payment_intent_data: {
        metadata: stripeMetadata,
      },
    });

    const updatedTransaction = await this.db
      .updateTable("payment_transactions")
      .set({
        checkout_id: session.id,
        metadata: {
          ...(input.metadata && typeof input.metadata === "object"
            ? input.metadata
            : {}),
          stripe_checkout_session: session,
        },
        updated_at: sql`now()`,
      })
      .where("id", "=", transaction.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      ...updatedTransaction,
      checkout_url: session.url ?? "",
    };
  }
}
