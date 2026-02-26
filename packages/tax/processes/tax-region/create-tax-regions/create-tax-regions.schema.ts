import { Type, type Static } from "@sinclair/typebox";
import { TaxRegionResponseSchema } from "../update-tax-regions/update-tax-regions.schema";

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

export const CreateTaxRegionsSchema = Type.Object({
  tax_regions: Type.Array(CreateTaxRegionSchema),
});

export type CreateTaxRegionProcessInput = Static<typeof CreateTaxRegionSchema>;
export type CreateTaxRegionsProcessInput = Static<typeof CreateTaxRegionsSchema>;

export const CreateTaxRegionsResponseSchema = Type.Array(TaxRegionResponseSchema);
export type CreateTaxRegionsProcessOutput = Static<
  typeof CreateTaxRegionsResponseSchema
>;
