import { Type, type Static } from "@sinclair/typebox";

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

export const TaxRateRuleResponseSchema = Type.Object({
  id: Type.String(),
  tax_rate_id: Type.String(),
  rule_type: Type.String(),
  value: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const UpdateTaxRateRulesResponseSchema = Type.Union([
  TaxRateRuleResponseSchema,
  Type.Undefined(),
]);
export type UpdateTaxRateRulesProcessOutput = Static<
  typeof UpdateTaxRateRulesResponseSchema
>;
