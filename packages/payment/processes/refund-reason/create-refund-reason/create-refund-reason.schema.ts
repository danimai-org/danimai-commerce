import { Type, type Static } from "@sinclair/typebox";
import { RefundReasonResponseSchema } from "../update-refund-reason/update-refund-reason.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateRefundReasonSchema = Type.Object({
  label: Type.String(),
  value: Type.String(),
  metadata: Metadata,
});

export type CreateRefundReasonProcessInput = Static<
  typeof CreateRefundReasonSchema
>;

export const CreateRefundReasonResponseSchema = Type.Union([
  RefundReasonResponseSchema,
]);
export type CreateRefundReasonProcessOutput = Static<
  typeof CreateRefundReasonResponseSchema
>;
