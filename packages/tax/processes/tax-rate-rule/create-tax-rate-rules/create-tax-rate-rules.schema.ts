import { Type, type Static } from "@sinclair/typebox";
import { TaxRateRuleResponseSchema } from "../update-tax-rate-rules/update-tax-rate-rules.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateTaxRateRuleSchema = Type.Object({
  tax_rate_id: Type.String(),
  rule_type: Type.String(),
  value: Type.String(),
  metadata: Metadata,
});

export const CreateTaxRateRulesSchema = Type.Object({
  tax_rate_rules: Type.Array(CreateTaxRateRuleSchema),
});

export type CreateTaxRateRuleProcessInput = Static<typeof CreateTaxRateRuleSchema>;
export type CreateTaxRateRulesProcessInput = Static<typeof CreateTaxRateRulesSchema>;

export const CreateTaxRateRulesResponseSchema = Type.Array(TaxRateRuleResponseSchema);
export type CreateTaxRateRulesProcessOutput = Static<
  typeof CreateTaxRateRulesResponseSchema
>;
