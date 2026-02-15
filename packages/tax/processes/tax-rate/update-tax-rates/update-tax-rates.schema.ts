import { Type, type Static } from "typebox";

export const UpdateTaxRateSchema = Type.Object({
  id: Type.String(),
  tax_region_id: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  rate: Type.Optional(Type.String()),
  is_combinable: Type.Optional(Type.Boolean()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateTaxRateProcessInput = Static<typeof UpdateTaxRateSchema>;
