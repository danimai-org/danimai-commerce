import { Type, type Static } from "typebox";
import {
  createFilterableColumnsSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { TaxRate } from "@danimai/tax/db";

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
