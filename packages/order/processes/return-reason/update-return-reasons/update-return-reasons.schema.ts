import { Type, type Static } from "@sinclair/typebox";

export const UpdateReturnReasonSchema = Type.Object({
  id: Type.String(),
  label: Type.Optional(Type.String()),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateReturnReasonProcessInput = Static<typeof UpdateReturnReasonSchema>;

export const ReturnReasonResponseSchema = Type.Object({
  id: Type.String(),
  label: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const UpdateReturnReasonsResponseSchema = Type.Union([
  ReturnReasonResponseSchema,
  Type.Undefined(),
]);
export type UpdateReturnReasonsProcessOutput = Static<
  typeof UpdateReturnReasonsResponseSchema
>;
