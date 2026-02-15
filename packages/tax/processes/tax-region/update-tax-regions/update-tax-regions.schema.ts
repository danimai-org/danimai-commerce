import { Type, type Static } from "typebox";

export const UpdateTaxRegionSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  tax_provider_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  parent_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateTaxRegionProcessInput = Static<typeof UpdateTaxRegionSchema>;
