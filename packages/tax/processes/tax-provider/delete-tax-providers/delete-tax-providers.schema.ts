import { Type, type Static } from "@sinclair/typebox";

export const DeleteTaxProvidersSchema = Type.Object({
  tax_provider_ids: Type.Array(Type.String()),
});

export type DeleteTaxProvidersProcessInput = Static<typeof DeleteTaxProvidersSchema>;

export const DeleteTaxProvidersResponseSchema = Type.Undefined();
export type DeleteTaxProvidersProcessOutput = void;
