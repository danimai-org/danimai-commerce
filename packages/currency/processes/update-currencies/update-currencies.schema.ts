import { Type, type Static } from "typebox";

export const UpdateCurrencySchema = Type.Object({
  id: Type.String(),
  tax_inclusive_pricing: Type.Optional(Type.Boolean()),
});

export type UpdateCurrencyProcessInput = Static<typeof UpdateCurrencySchema>;
