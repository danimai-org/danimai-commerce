import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { TaxRateRule } from "@danimai/tax/db";
import { TaxRateRuleResponseSchema } from "../update-tax-rate-rules/update-tax-rate-rules.schema";

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

export const PaginatedTaxRateRulesResponseSchema =
  createPaginatedResponseSchema(TaxRateRuleResponseSchema);
export type PaginatedTaxRateRulesProcessOutput = Static<
  typeof PaginatedTaxRateRulesResponseSchema
>;
