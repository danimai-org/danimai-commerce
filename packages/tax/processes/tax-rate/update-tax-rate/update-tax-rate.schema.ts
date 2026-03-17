import { Type, type Static } from "@sinclair/typebox";
import { TaxRateResponseSchema } from "../retrieve-tax-rate/retrieve-tax-rate.schema";

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

export const UpdateTaxRatesResponseSchema = Type.Union([
  TaxRateResponseSchema,
  Type.Undefined(),
]);
export type UpdateTaxRatesProcessOutput = Static<
  typeof UpdateTaxRatesResponseSchema
>;
