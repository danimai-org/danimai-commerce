import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { PaymentResponseSchema } from "../update-payment/update-payment.schema";

const PaymentStatusSchema = Type.Union([
  Type.Literal("pending"),
  Type.Literal("failed"),
  Type.Literal("succeeded"),
  Type.Literal("cancelled"),
]);

export const PaginatedPaymentsSchema = createPaginationSchema(
  Type.Object({
    order_id: Type.Optional(Type.String()),
    provider_id: Type.Optional(Type.String({ format: "uuid" })),
    customer_id: Type.Optional(Type.String()),
    currency_code: Type.Optional(Type.String()),
    last_status: Type.Optional(PaymentStatusSchema),
    amount_greater_than: Type.Optional(
      Type.Union([Type.String(), Type.Number()])
    ),
    amount_less_than: Type.Optional(
      Type.Union([Type.String(), Type.Number()])
    ),
  }),
  [
    "payments.id",
    "payments.amount",
    "payments.currency_code",
    "payments.last_status",
    "payments.created_at",
    "payments.updated_at",
  ]
);

export type PaginatedPaymentsProcessInput = StaticDecode<
  typeof PaginatedPaymentsSchema
>;

export const PaginatedPaymentsResponseSchema =
  createPaginatedResponseSchema(PaymentResponseSchema);
export type PaginatedPaymentsProcessOutput = Static<
  typeof PaginatedPaymentsResponseSchema
>;
