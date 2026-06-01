import { Type, type Static } from "@sinclair/typebox";

const Metadata = Type.Optional(
  Type.Union([
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    ),
    Type.Null(),
  ])
);

export const UpdateRefundReasonSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  label: Type.Optional(Type.String()),
  value: Type.Optional(Type.String()),
  metadata: Metadata,
});

export type UpdateRefundReasonProcessInput = Static<
  typeof UpdateRefundReasonSchema
>;

export const RefundReasonResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  label: Type.String(),
  value: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const UpdateRefundReasonResponseSchema = Type.Union([
  RefundReasonResponseSchema,
  Type.Undefined(),
]);
export type UpdateRefundReasonProcessOutput = Static<
  typeof UpdateRefundReasonResponseSchema
>;
