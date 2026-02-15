import { Type, type Static } from "typebox";

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
