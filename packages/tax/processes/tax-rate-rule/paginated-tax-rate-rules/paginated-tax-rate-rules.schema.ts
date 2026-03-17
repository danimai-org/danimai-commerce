import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { TaxRateRuleResponseSchema } from "../retrieve-tax-rate-rule/retrieve-tax-rate-rule.schema";

export const PaginatedTaxRateRulesSchema = createPaginationSchema(
  Type.Object({}),
  [
    "tax_rate_rules.id",
    "tax_rate_rules.tax_rate_id",
    "tax_rate_rules.rule_type",
    "tax_rate_rules.value",
    "tax_rate_rules.created_at",
    "tax_rate_rules.updated_at",
  ]
);

export type PaginatedTaxRateRulesProcessInput = StaticDecode<
  typeof PaginatedTaxRateRulesSchema
>;

export const PaginatedTaxRateRulesResponseSchema =
  createPaginatedResponseSchema(TaxRateRuleResponseSchema);
export type PaginatedTaxRateRulesProcessOutput = Static<
  typeof PaginatedTaxRateRulesResponseSchema
>;
