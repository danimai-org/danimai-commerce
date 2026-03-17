import { Type, type Static } from "@sinclair/typebox";

export const RetrieveTaxRateRuleSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveTaxRateRuleProcessInput = Static<
  typeof RetrieveTaxRateRuleSchema
>;

export const TaxRateRuleResponseSchema = Type.Object({
  id: Type.String(),
  tax_rate_id: Type.String(),
  rule_type: Type.String(),
  value: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveTaxRateRuleResponseSchema = Type.Union([
  TaxRateRuleResponseSchema,
  Type.Undefined(),
]);
export type RetrieveTaxRateRuleProcessOutput = Static<
  typeof RetrieveTaxRateRuleResponseSchema
>;
