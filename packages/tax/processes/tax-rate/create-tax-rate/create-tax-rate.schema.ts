import { Type, type Static } from "@sinclair/typebox";
import { TaxRateResponseSchema } from "../retrieve-tax-rate/retrieve-tax-rate.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateTaxRateSchema = Type.Object({
  tax_region_id: Type.String(),
  name: Type.String(),
  code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  rate: Type.String(),
  is_combinable: Type.Optional(Type.Boolean()),
  metadata: Metadata,
});

export type CreateTaxRateProcessInput = Static<typeof CreateTaxRateSchema>;
export const CreateTaxRateResponseSchema = Type.Union([TaxRateResponseSchema]);
export type CreateTaxRateProcessOutput = Static<typeof CreateTaxRateResponseSchema>;
