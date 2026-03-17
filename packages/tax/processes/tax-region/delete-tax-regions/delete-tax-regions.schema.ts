import { Type, type Static } from "@sinclair/typebox";

export const DeleteTaxRegionsSchema = Type.Object({
  tax_region_ids: Type.Array(Type.String(), { uniqueItems: true }),
});

export type DeleteTaxRegionsProcessInput = Static<typeof DeleteTaxRegionsSchema>;

export const DeleteTaxRegionsResponseSchema = Type.Undefined();
export type DeleteTaxRegionsProcessOutput = void;
