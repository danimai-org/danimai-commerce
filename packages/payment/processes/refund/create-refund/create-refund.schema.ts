import { Type, type Static } from "@sinclair/typebox";
import { RefundResponseSchema } from "../update-refund/update-refund.schema";

const Metadata = Type.Optional(
  Type.Union([
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    ),
    Type.Null(),
  ])
);

export const CreateRefundSchema = Type.Object({
  payment_transaction_id: Type.String({ format: "uuid" }),
  amount: Type.Union([Type.String(), Type.Number()]),
  refund_reason_id: Type.Optional(Type.String({ format: "uuid" })),
  created_by: Type.Optional(Type.String()),
  metadata: Metadata,
});

export type CreateRefundProcessInput = Static<typeof CreateRefundSchema>;

export const CreateRefundResponseSchema = Type.Union([RefundResponseSchema]);
export type CreateRefundProcessOutput = Static<
  typeof CreateRefundResponseSchema
>;
