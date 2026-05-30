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

export const UpdatePaymentSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  last_status: Type.Optional(PaymentStatusSchema),
  last_transaction_id: Type.Optional(
    Type.Union([Type.String({ format: "uuid" }), Type.Null()])
  ),
  success_transaction_id: Type.Optional(
    Type.Union([Type.String({ format: "uuid" }), Type.Null()])
  ),
  metadata: Metadata,
});

export type UpdatePaymentProcessInput = Static<typeof UpdatePaymentSchema>;

export const PaymentResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  order_id: Type.String(),
  customer_id: Type.String(),
  provider_id: Type.String({ format: "uuid" }),
  amount: Type.String(),
  currency_code: Type.String(),
  last_status: PaymentStatusSchema,
  last_transaction_id: Type.Union([Type.String({ format: "uuid" }), Type.Null()]),
  success_transaction_id: Type.Union([
    Type.String({ format: "uuid" }),
    Type.Null(),
  ]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const UpdatePaymentResponseSchema = Type.Union([
  PaymentResponseSchema,
  Type.Undefined(),
]);
export type UpdatePaymentProcessOutput = Static<
  typeof UpdatePaymentResponseSchema
>;
