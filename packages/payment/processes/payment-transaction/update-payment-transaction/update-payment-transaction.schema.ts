import { Type, type Static } from "@sinclair/typebox";

const PaymentStatusSchema = Type.Union([
  Type.Literal("pending"),
  Type.Literal("failed"),
  Type.Literal("succeeded"),
  Type.Literal("cancelled"),
]);

export const PaymentTransactionResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  payment_id: Type.String({ format: "uuid" }),
  provider_id: Type.String({ format: "uuid" }),
  amount: Type.String(),
  currency_code: Type.String(),
  last_status: PaymentStatusSchema,
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  payment_intent_id: Type.Union([Type.String(), Type.Null()]),
  checkout_id: Type.Union([Type.String(), Type.Null()]),
  customer_id: Type.String(),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const UpdatePaymentTransactionSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  payment_intent_id: Type.String(),
});

export type UpdatePaymentTransactionProcessInput = Static<
  typeof UpdatePaymentTransactionSchema
>;

export const UpdatePaymentTransactionResponseSchema = Type.Union([
  PaymentTransactionResponseSchema,
]);
export type UpdatePaymentTransactionProcessOutput = Static<
  typeof UpdatePaymentTransactionResponseSchema
>;
