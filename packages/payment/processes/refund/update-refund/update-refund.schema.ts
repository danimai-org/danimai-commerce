import { Type, type Static } from "@sinclair/typebox";

const PaymentStatusSchema = Type.Union([
  Type.Literal("pending"),
  Type.Literal("failed"),
  Type.Literal("succeeded"),
  Type.Literal("cancelled"),
]);

const Metadata = Type.Optional(
  Type.Union([
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    ),
    Type.Null(),
  ])
);

export const UpdateRefundSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  last_status: Type.Optional(PaymentStatusSchema),
  metadata: Metadata,
  refund_reason_id: Type.Optional(
    Type.Union([Type.String({ format: "uuid" }), Type.Null()])
  ),
});

export type UpdateRefundProcessInput = Static<typeof UpdateRefundSchema>;

export const RefundResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  customer_id: Type.String(),
  customer_display: Type.Optional(Type.String()),
  payment_id: Type.String({ format: "uuid" }),
  payment_transaction_id: Type.String({ format: "uuid" }),
  amount: Type.String(),
  refund_reason_id: Type.Union([Type.String({ format: "uuid" }), Type.Null()]),
  refund_reason_label: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  last_status: PaymentStatusSchema,
  stripe_refund_id: Type.Union([Type.String(), Type.Null()]),
  created_by: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const UpdateRefundResponseSchema = Type.Union([
  RefundResponseSchema,
  Type.Undefined(),
]);
export type UpdateRefundProcessOutput = Static<
  typeof UpdateRefundResponseSchema
>;
