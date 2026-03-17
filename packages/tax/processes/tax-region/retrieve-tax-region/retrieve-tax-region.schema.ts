import { Type, type Static } from "@sinclair/typebox";

export const RetrieveTaxRegionSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveTaxRegionProcessInput = Static<
  typeof RetrieveTaxRegionSchema
>;

export const TaxRegionResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  tax_provider_id: Type.Union([Type.String(), Type.Null()]),
  parent_id: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveTaxRegionResponseSchema = Type.Union([
  TaxRegionResponseSchema,
  Type.Undefined(),
]);
export type RetrieveTaxRegionProcessOutput = Static<
  typeof RetrieveTaxRegionResponseSchema
>;
