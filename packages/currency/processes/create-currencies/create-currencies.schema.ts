import { Type, type Static } from "@sinclair/typebox";
import { CurrencyResponseSchema } from "../retrieve-currency/retrieve-currency.schema";

const CreateCurrencyItemSchema = Type.Object({
  code: Type.String(),
  tax_inclusive_pricing: Type.Optional(Type.Boolean()),
});

export const CreateCurrenciesSchema = Type.Object({
  currencies: Type.Array(CreateCurrencyItemSchema),
});

export type CreateCurrencyItemInput = Static<typeof CreateCurrencyItemSchema>;
export type CreateCurrenciesProcessInput = Static<typeof CreateCurrenciesSchema>;

export const CreateCurrenciesResponseSchema = Type.Array(CurrencyResponseSchema);

export type CreateCurrenciesProcessOutput = Static<typeof CreateCurrenciesResponseSchema>;
