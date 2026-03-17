import { Type, type Static } from "@sinclair/typebox";
import { TaxRateRuleResponseSchema } from "../retrieve-tax-rate-rule/retrieve-tax-rate-rule.schema";

export const UpdateTaxRateRuleSchema = Type.Object({
  id: Type.String(),
  tax_rate_id: Type.Optional(Type.String()),
  rule_type: Type.Optional(Type.String()),
  value: Type.Optional(Type.String()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateTaxRateRuleProcessInput = Static<typeof UpdateTaxRateRuleSchema>;

export const UpdateTaxRateRulesResponseSchema = Type.Union([
  TaxRateRuleResponseSchema,
  Type.Undefined(),
]);
export type UpdateTaxRateRulesProcessOutput = Static<
  typeof UpdateTaxRateRulesResponseSchema
>;
