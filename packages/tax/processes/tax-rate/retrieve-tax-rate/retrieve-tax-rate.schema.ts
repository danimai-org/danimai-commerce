import { Type, type Static } from "@sinclair/typebox";

export const RetrieveTaxRateSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveTaxRateProcessInput = Static<typeof RetrieveTaxRateSchema>;

export const TaxRateResponseSchema = Type.Object({
  id: Type.String(),
  tax_region_id: Type.String(),
  name: Type.String(),
  code: Type.Union([Type.String(), Type.Null()]),
  rate: Type.String(),
  is_combinable: Type.Boolean(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveTaxRateResponseSchema = Type.Union([
  TaxRateResponseSchema,
  Type.Undefined(),
]);
export type RetrieveTaxRateProcessOutput = Static<
  typeof RetrieveTaxRateResponseSchema
>;
