import { Type, type Static } from "typebox";

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
