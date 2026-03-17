import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { TaxRegionResponseSchema } from "../retrieve-tax-region/retrieve-tax-region.schema";

export const PaginatedTaxRegionsSchema = createPaginationSchema(
  Type.Object({}),
  [
    "tax_regions.id",
    "tax_regions.name",
    "tax_regions.tax_provider_id",
    "tax_regions.parent_id",
    "tax_regions.created_at",
    "tax_regions.updated_at",
  ]
);

export type PaginatedTaxRegionsProcessInput = StaticDecode<
  typeof PaginatedTaxRegionsSchema
>;

export const PaginatedTaxRegionsResponseSchema =
  createPaginatedResponseSchema(TaxRegionResponseSchema);
export type PaginatedTaxRegionsProcessOutput = Static<
  typeof PaginatedTaxRegionsResponseSchema
>;
