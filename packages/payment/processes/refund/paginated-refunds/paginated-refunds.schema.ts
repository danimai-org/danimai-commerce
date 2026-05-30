import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { RefundResponseSchema } from "../update-refund/update-refund.schema";

const PaymentStatusSchema = Type.Union([
  Type.Literal("pending"),
  Type.Literal("failed"),
  Type.Literal("succeeded"),
  Type.Literal("cancelled"),
]);

export const PaginatedRefundsSchema = createPaginationSchema(
  Type.Object({
    payment_id: Type.Optional(Type.String({ format: "uuid" })),
    customer_id: Type.Optional(Type.String()),
    payment_transaction_id: Type.Optional(Type.String({ format: "uuid" })),
    refund_reason_id: Type.Optional(Type.String({ format: "uuid" })),
    last_status: Type.Optional(PaymentStatusSchema),
    amount_greater_than: Type.Optional(
      Type.Union([Type.String(), Type.Number()])
    ),
    amount_less_than: Type.Optional(
      Type.Union([Type.String(), Type.Number()])
    ),
    created_by: Type.Optional(Type.String()),
  }),
  [
    "refunds.id",
    "refunds.amount",
    "refunds.last_status",
    "refunds.created_at",
    "refunds.updated_at",
  ]
);

export type PaginatedRefundsProcessInput = StaticDecode<
  typeof PaginatedRefundsSchema
>;

export const PaginatedRefundsResponseSchema =
  createPaginatedResponseSchema(RefundResponseSchema);
export type PaginatedRefundsProcessOutput = Static<
  typeof PaginatedRefundsResponseSchema
>;
