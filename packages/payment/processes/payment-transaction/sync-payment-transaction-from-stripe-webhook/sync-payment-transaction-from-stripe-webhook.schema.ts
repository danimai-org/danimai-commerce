import { Type, type Static } from "@sinclair/typebox";

export const SyncPaymentTransactionFromStripeWebhookSchema = Type.Object({
  event_type: Type.String(),
  payment_transaction_id: Type.Optional(Type.String({ format: "uuid" })),
  payment_intent_id: Type.Optional(Type.String()),
  session_id: Type.Optional(Type.String()),
});

export type SyncPaymentTransactionFromStripeWebhookProcessInput = Static<
  typeof SyncPaymentTransactionFromStripeWebhookSchema
>;

export const SyncPaymentTransactionFromStripeWebhookResponseSchema = Type.Object({
  received: Type.Boolean(),
  synced: Type.Boolean(),
  transaction_id: Type.Optional(Type.String({ format: "uuid" })),
});

export type SyncPaymentTransactionFromStripeWebhookProcessOutput = Static<
  typeof SyncPaymentTransactionFromStripeWebhookResponseSchema
>;
