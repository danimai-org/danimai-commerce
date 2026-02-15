import { Type, type Static } from "typebox";
import {
  createFilterableColumnsSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { TaxRateRule } from "@danimai/tax/db";

export const PaginatedTaxRateRulesSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    filters: Type.Optional(
      createFilterableColumnsSchema<
        keyof Pick<TaxRateRule, "tax_rate_id" | "rule_type">
      >({
        tax_rate_id: [FilterOperator.EQUAL, FilterOperator.IN],
        rule_type: true,
      })
    ),
  }),
]);

export type PaginatedTaxRateRulesProcessInput = Static<
  typeof PaginatedTaxRateRulesSchema
>;
