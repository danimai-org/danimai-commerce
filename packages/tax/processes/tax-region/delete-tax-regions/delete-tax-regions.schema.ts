import { Type, type Static } from "typebox";

export const DeleteTaxRegionsSchema = Type.Object({
  tax_region_ids: Type.Array(Type.String()),
});

export type DeleteTaxRegionsProcessInput = Static<typeof DeleteTaxRegionsSchema>;
