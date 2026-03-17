import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { TaxRateResponseSchema } from "../retrieve-tax-rate/retrieve-tax-rate.schema";

export const PaginatedTaxRatesSchema = createPaginationSchema(
  Type.Object({}),
  [
    "tax_rates.id",
    "tax_rates.tax_region_id",
    "tax_rates.name",
    "tax_rates.code",
    "tax_rates.rate",
    "tax_rates.is_combinable",
    "tax_rates.created_at",
    "tax_rates.updated_at",
  ]
);

export type PaginatedTaxRatesProcessInput = StaticDecode<
  typeof PaginatedTaxRatesSchema
>;

export const PaginatedTaxRatesResponseSchema =
  createPaginatedResponseSchema(TaxRateResponseSchema);
export type PaginatedTaxRatesProcessOutput = Static<
  typeof PaginatedTaxRatesResponseSchema
>;
