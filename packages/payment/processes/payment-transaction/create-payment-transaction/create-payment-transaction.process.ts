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
import { ensurePaymentCustomer } from "../../payment-customer/ensure-payment-customer";
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
 * Creates a payment transaction from a payment and initiates Stripe collection.
 * Input: payment_id, optional metadata; with success_url and cancel_url uses Checkout redirect.
 * Output: payment_transactions row plus checkout_url or PaymentIntent secrets for Elements.
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

    const useCheckout = Boolean(input.success_url && input.cancel_url);
    if (
      (input.success_url && !input.cancel_url) ||
      (!input.success_url && input.cancel_url)
    ) {
      throw new ValidationError(
        "success_url and cancel_url must both be provided for Checkout",
        [
          {
            type: "invalid",
            message: "success_url and cancel_url must both be provided",
            path: "success_url",
          },
        ]
      );
    }

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

    const paymentCustomer = await ensurePaymentCustomer(
      this.db,
      this.stripe,
      payment.customer_id,
      payment.provider_id
    );

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
      customer_id: payment.customer_id,
      ...(input.metadata ?? {}),
    });

    if (useCheckout) {
      const session = await this.stripe.checkout.sessions.create({
        mode: "payment",
        customer: paymentCustomer.stripe_customer_id,
        success_url: input.success_url!,
        cancel_url: input.cancel_url!,
        line_items: [
          {
            price_data: {
              currency: payment.currency_code.toLowerCase(),
              unit_amount: toStripeUnitAmount(String(payment.amount)),
              product_data: {
                name: "Order payment",
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

      if (!session.url) {
        throw new ValidationError("Stripe Checkout URL was not returned", [
          {
            type: "invalid",
            message: "Stripe Checkout URL was not returned",
            path: "success_url",
          },
        ]);
      }

      return {
        ...updatedTransaction,
        stripe_customer_id: paymentCustomer.stripe_customer_id,
        checkout_url: session.url,
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: toStripeUnitAmount(String(payment.amount)),
      currency: payment.currency_code.toLowerCase(),
      customer: paymentCustomer.stripe_customer_id,
      setup_future_usage: "on_session",
      metadata: stripeMetadata,
      automatic_payment_methods: { enabled: true },
    });

    const customerSession = await this.stripe.customerSessions.create({
      customer: paymentCustomer.stripe_customer_id,
      components: {
        payment_element: {
          enabled: true,
          features: {
            payment_method_save: "enabled",
            payment_method_redisplay: "enabled",
          },
        },
      },
    });

    const updatedTransaction = await this.db
      .updateTable("payment_transactions")
      .set({
        payment_intent_id: paymentIntent.id,
        metadata: {
          ...(input.metadata && typeof input.metadata === "object"
            ? input.metadata
            : {}),
          stripe_payment_intent: paymentIntent,
        },
        updated_at: sql`now()`,
      })
      .where("id", "=", transaction.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      ...updatedTransaction,
      stripe_customer_id: paymentCustomer.stripe_customer_id,
      payment_intent_client_secret: paymentIntent.client_secret,
      customer_session_client_secret: customerSession.client_secret,
    };
  }
}
