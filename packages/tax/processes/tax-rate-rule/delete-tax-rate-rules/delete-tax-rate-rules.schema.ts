import { Type, type Static } from "typebox";

export const DeleteTaxRateRulesSchema = Type.Object({
  tax_rate_rule_ids: Type.Array(Type.String()),
});

export type DeleteTaxRateRulesProcessInput = Static<typeof DeleteTaxRateRulesSchema>;
