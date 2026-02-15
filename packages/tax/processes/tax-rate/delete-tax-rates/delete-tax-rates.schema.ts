import { Type, type Static } from "typebox";

export const DeleteTaxRatesSchema = Type.Object({
  tax_rate_ids: Type.Array(Type.String()),
});

export type DeleteTaxRatesProcessInput = Static<typeof DeleteTaxRatesSchema>;
