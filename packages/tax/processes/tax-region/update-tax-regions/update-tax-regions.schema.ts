import { Type, type Static } from "@sinclair/typebox";

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

export const TaxRegionResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  tax_provider_id: Type.Union([Type.String(), Type.Null()]),
  parent_id: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const UpdateTaxRegionsResponseSchema = Type.Union([
  TaxRegionResponseSchema,
  Type.Undefined(),
]);
export type UpdateTaxRegionsProcessOutput = Static<
  typeof UpdateTaxRegionsResponseSchema
>;
