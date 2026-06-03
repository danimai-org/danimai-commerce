import { Type, type Static } from "@sinclair/typebox";
import { PaymentTransactionResponseSchema } from "../update-payment-transaction/update-payment-transaction.schema";

const Metadata = Type.Optional(
  Type.Union([
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    ),
    Type.Null(),
  ])
);

export const CreatePaymentTransactionSchema = Type.Object({
  payment_id: Type.String({ format: "uuid" }),
  metadata: Metadata,
  success_url: Type.Optional(Type.String()),
  cancel_url: Type.Optional(Type.String()),
});

export type CreatePaymentTransactionProcessInput = Static<
  typeof CreatePaymentTransactionSchema
>;

export const CreatePaymentTransactionResponseSchema = Type.Intersect([
  PaymentTransactionResponseSchema,
  Type.Object({
    stripe_customer_id: Type.Optional(Type.String()),
    payment_intent_client_secret: Type.Optional(
      Type.Union([Type.String(), Type.Null()])
    ),
    customer_session_client_secret: Type.Optional(
      Type.Union([Type.String(), Type.Null()])
    ),
    checkout_url: Type.Optional(Type.String()),
  }),
]);
export type CreatePaymentTransactionProcessOutput = Static<
  typeof CreatePaymentTransactionResponseSchema
>;
