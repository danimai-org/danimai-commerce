import { Type, type Static } from "typebox";

export const DeleteTaxProvidersSchema = Type.Object({
  tax_provider_ids: Type.Array(Type.String()),
});

export type DeleteTaxProvidersProcessInput = Static<typeof DeleteTaxProvidersSchema>;
