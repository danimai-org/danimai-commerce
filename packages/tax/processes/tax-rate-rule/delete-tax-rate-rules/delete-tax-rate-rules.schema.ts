import { Type, type Static } from "@sinclair/typebox";

export const DeleteTaxRateRulesSchema = Type.Object({
  tax_rate_rule_ids: Type.Array(Type.String()),
});

export type DeleteTaxRateRulesProcessInput = Static<typeof DeleteTaxRateRulesSchema>;

export const DeleteTaxRateRulesResponseSchema = Type.Undefined();
export type DeleteTaxRateRulesProcessOutput = void;
