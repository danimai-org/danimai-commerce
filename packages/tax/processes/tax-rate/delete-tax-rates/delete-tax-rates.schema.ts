import { Type, type Static } from "@sinclair/typebox";

export const DeleteTaxRatesSchema = Type.Object({
  tax_rate_ids: Type.Array(Type.String()),
});

export type DeleteTaxRatesProcessInput = Static<typeof DeleteTaxRatesSchema>;

export const DeleteTaxRatesResponseSchema = Type.Undefined();
export type DeleteTaxRatesProcessOutput = void;
