import { Type, type Static } from "typebox";

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

export const CreateTaxRatesSchema = Type.Object({
  tax_rates: Type.Array(CreateTaxRateSchema),
});

export type CreateTaxRateProcessInput = Static<typeof CreateTaxRateSchema>;
export type CreateTaxRatesProcessInput = Static<typeof CreateTaxRatesSchema>;
