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
  type UpdatePaymentTransactionProcessOutput,
  UpdatePaymentTransactionSchema,
} from "./update-payment-transaction.schema";
import type { Database, PaymentStatus } from "../../../db/type";

/** Maps Stripe PaymentIntent status to local payment transaction status. */
function mapPaymentIntentStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "cancelled";
    case "requires_payment_method":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * Updates a payment transaction after validating payment intent against checkout.
 * Input: transaction id and payment_intent_id.
 * Output: updated payment_transactions row; syncs parent payment on success.
 */
export const UPDATE_PAYMENT_TRANSACTION_PROCESS = Symbol(
  "UpdatePaymentTransaction"
);

@Process(UPDATE_PAYMENT_TRANSACTION_PROCESS)
export class UpdatePaymentTransactionProcess
  implements
    ProcessContract<
      typeof UpdatePaymentTransactionSchema,
      UpdatePaymentTransactionProcessOutput
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
    @ProcessContext({ schema: UpdatePaymentTransactionSchema })
    context: ProcessContextType<typeof UpdatePaymentTransactionSchema>
  ) {
    const { input } = context;
    this.logger.info("Updating payment transaction", { id: input.id });

    const transaction = await this.db
      .selectFrom("payment_transactions")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!transaction) {
      throw new NotFoundError("Payment transaction not found");
    }

    if (!transaction.checkout_id) {
      throw new ValidationError("Checkout not created for transaction", [
        {
          type: "invalid",
          message: "Checkout not created for transaction",
          path: "id",
        },
      ]);
    }

    const session = await this.stripe.checkout.sessions.retrieve(
      transaction.checkout_id
    );

    const sessionPaymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!sessionPaymentIntentId) {
      throw new ValidationError("Checkout session has no payment intent", [
        {
          type: "invalid",
          message: "Checkout session has no payment intent",
          path: "payment_intent_id",
        },
      ]);
    }

    if (input.payment_intent_id !== sessionPaymentIntentId) {
      throw new ValidationError(
        "Payment intent does not match checkout session",
        [
          {
            type: "invalid",
            message: "Payment intent does not match checkout session",
            path: "payment_intent_id",
          },
        ]
      );
    }

    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      input.payment_intent_id
    );

    if (
      paymentIntent.metadata.payment_transaction_id !== transaction.id
    ) {
      throw new ValidationError(
        "Payment intent metadata does not match transaction",
        [
          {
            type: "invalid",
            message: "Payment intent metadata does not match transaction",
            path: "payment_intent_id",
          },
        ]
      );
    }

    const lastStatus = mapPaymentIntentStatus(paymentIntent.status);

    const updatedTransaction = await this.db
      .updateTable("payment_transactions")
      .set({
        payment_intent_id: input.payment_intent_id,
        last_status: lastStatus,
        metadata: {
          ...(transaction.metadata &&
          typeof transaction.metadata === "object" &&
          !Array.isArray(transaction.metadata)
            ? transaction.metadata
            : {}),
          stripe_payment_intent: paymentIntent,
        },
        updated_at: sql`now()`,
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();

    if (lastStatus === "succeeded") {
      await this.db
        .updateTable("payments")
        .set({
          last_transaction_id: transaction.id,
          success_transaction_id: transaction.id,
          last_status: "succeeded",
          updated_at: sql`now()`,
        })
        .where("id", "=", transaction.payment_id)
        .where("deleted_at", "is", null)
        .execute();
    } else {
      await this.db
        .updateTable("payments")
        .set({
          last_transaction_id: transaction.id,
          last_status: lastStatus,
          updated_at: sql`now()`,
        })
        .where("id", "=", transaction.payment_id)
        .where("deleted_at", "is", null)
        .execute();
    }

    return updatedTransaction;
  }
}
