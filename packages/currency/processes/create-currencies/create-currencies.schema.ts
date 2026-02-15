import { Type, type Static } from "typebox";

const CreateCurrencyItemSchema = Type.Object({
  code: Type.String(),
  tax_inclusive_pricing: Type.Optional(Type.Boolean()),
});

export const CreateCurrenciesSchema = Type.Object({
  currencies: Type.Array(CreateCurrencyItemSchema),
});

export type CreateCurrencyItemInput = Static<typeof CreateCurrencyItemSchema>;
export type CreateCurrenciesProcessInput = Static<typeof CreateCurrenciesSchema>;
