import { Type, type Static } from "@sinclair/typebox";
import { TaxRateRuleResponseSchema } from "../retrieve-tax-rate-rule/retrieve-tax-rate-rule.schema";

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

export type CreateTaxRateRuleProcessInput = Static<typeof CreateTaxRateRuleSchema>;
export const CreateTaxRateRuleResponseSchema = Type.Union([TaxRateRuleResponseSchema]);
export type CreateTaxRateRuleProcessOutput = Static<typeof CreateTaxRateRuleResponseSchema>;
