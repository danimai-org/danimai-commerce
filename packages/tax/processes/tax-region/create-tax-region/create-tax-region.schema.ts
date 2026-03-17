import { Type, type Static } from "@sinclair/typebox";
import { TaxRegionResponseSchema } from "../retrieve-tax-region/retrieve-tax-region.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateTaxRegionSchema = Type.Object({
  name: Type.String(),
  tax_provider_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  parent_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Metadata,
});

export type CreateTaxRegionProcessInput = Static<typeof CreateTaxRegionSchema>;
export const CreateTaxRegionResponseSchema = Type.Union([TaxRegionResponseSchema]);
export type CreateTaxRegionProcessOutput = Static<typeof CreateTaxRegionResponseSchema>;
