import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { TaxRate } from "@danimai/tax/db";
import { TaxRateResponseSchema } from "../update-tax-rates/update-tax-rates.schema";

export const PaginatedTaxRatesSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    filters: Type.Optional(
      createFilterableColumnsSchema<
        keyof Pick<TaxRate, "tax_region_id" | "name">
      >({
        tax_region_id: [FilterOperator.EQUAL, FilterOperator.IN],
        name: true,
      })
    ),
  }),
]);

export type PaginatedTaxRatesProcessInput = Static<
  typeof PaginatedTaxRatesSchema
>;

export const PaginatedTaxRatesResponseSchema =
  createPaginatedResponseSchema(TaxRateResponseSchema);
export type PaginatedTaxRatesProcessOutput = Static<
  typeof PaginatedTaxRatesResponseSchema
>;
