import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { PaymentTransactionResponseSchema } from "../update-payment-transaction/update-payment-transaction.schema";

const PaymentStatusSchema = Type.Union([
  Type.Literal("pending"),
  Type.Literal("failed"),
  Type.Literal("succeeded"),
  Type.Literal("cancelled"),
]);

export const PaginatedPaymentTransactionsSchema = createPaginationSchema(
  Type.Object({
    payment_id: Type.Optional(Type.String({ format: "uuid" })),
    provider_id: Type.Optional(Type.String({ format: "uuid" })),
    customer_id: Type.Optional(Type.String()),
    last_status: Type.Optional(PaymentStatusSchema),
    amount_greater_than: Type.Optional(
      Type.Union([Type.String(), Type.Number()])
    ),
    amount_less_than: Type.Optional(
      Type.Union([Type.String(), Type.Number()])
    ),
  }),
  [
    "payment_transactions.id",
    "payment_transactions.amount",
    "payment_transactions.last_status",
    "payment_transactions.created_at",
    "payment_transactions.updated_at",
  ]
);

export type PaginatedPaymentTransactionsProcessInput = StaticDecode<
  typeof PaginatedPaymentTransactionsSchema
>;

export const PaginatedPaymentTransactionsResponseSchema =
  createPaginatedResponseSchema(PaymentTransactionResponseSchema);
export type PaginatedPaymentTransactionsProcessOutput = Static<
  typeof PaginatedPaymentTransactionsResponseSchema
>;
