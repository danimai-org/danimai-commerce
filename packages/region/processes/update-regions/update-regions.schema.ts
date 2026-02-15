import { Type, type Static } from "typebox";

export const UpdateRegionSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  currency_code: Type.Optional(Type.String()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateRegionProcessInput = Static<typeof UpdateRegionSchema>;
