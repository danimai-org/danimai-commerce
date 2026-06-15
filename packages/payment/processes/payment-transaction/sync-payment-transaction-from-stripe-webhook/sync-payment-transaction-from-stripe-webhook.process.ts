import {
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { inject } from "inversify";
import type { Logger } from "@logtape/logtape";
import {
  UPDATE_PAYMENT_TRANSACTION_PROCESS,
  UpdatePaymentTransactionProcess,
} from "../update-payment-transaction";
import {
  type SyncPaymentTransactionFromStripeWebhookProcessOutput,
  SyncPaymentTransactionFromStripeWebhookSchema,
} from "./sync-payment-transaction-from-stripe-webhook.schema";

const SYNCABLE_STRIPE_EVENTS = new Set([
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "checkout.session.completed",
]);

/**
 * Syncs a payment transaction from a Stripe webhook event.
 * Input: Stripe event type plus payment_transaction_id and Stripe resource ids.
 * Output: received/synced flags and optional transaction id when updated.
 */
export const SYNC_PAYMENT_TRANSACTION_FROM_STRIPE_WEBHOOK_PROCESS = Symbol(
  "SyncPaymentTransactionFromStripeWebhook",
);

@Process(SYNC_PAYMENT_TRANSACTION_FROM_STRIPE_WEBHOOK_PROCESS)
export class SyncPaymentTransactionFromStripeWebhookProcess
  implements
    ProcessContract<
      typeof SyncPaymentTransactionFromStripeWebhookSchema,
      SyncPaymentTransactionFromStripeWebhookProcessOutput
    >
{
  constructor(
    @InjectLogger()
    private readonly logger: Logger,
    @inject(UPDATE_PAYMENT_TRANSACTION_PROCESS)
    private readonly updatePaymentTransaction: UpdatePaymentTransactionProcess,
  ) {}

  async runOperations(
    @ProcessContext({ schema: SyncPaymentTransactionFromStripeWebhookSchema })
    context: ProcessContextType<
      typeof SyncPaymentTransactionFromStripeWebhookSchema
    >,
  ) {
    const { input } = context;

    if (!SYNCABLE_STRIPE_EVENTS.has(input.event_type)) {
      return { received: true, synced: false };
    }

    if (!input.payment_transaction_id) {
      this.logger.warn("Stripe webhook missing payment_transaction_id", {
        event_type: input.event_type,
      });
      return { received: true, synced: false };
    }

    await this.updatePaymentTransaction.runOperations({
      input: {
        id: input.payment_transaction_id,
        payment_intent_id: input.payment_intent_id,
        session_id: input.session_id,
      },
    });

    this.logger.info("Synced payment transaction from Stripe webhook", {
      event_type: input.event_type,
      transaction_id: input.payment_transaction_id,
    });

    return {
      received: true,
      synced: true,
      transaction_id: input.payment_transaction_id,
    };
  }
}
