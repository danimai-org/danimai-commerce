import { Type, type Static } from "@sinclair/typebox";
import { CurrencyResponseSchema } from "../retrieve-currency/retrieve-currency.schema";

export const CreateCurrencyItemSchema = Type.Object({
  code: Type.String(),
  tax_inclusive_pricing: Type.Boolean(),
});

export const CreateCurrenciesSchema = Type.Object({
  currencies: Type.Array(CreateCurrencyItemSchema),
});

export type CreateCurrenciesInput = Static<typeof CreateCurrenciesSchema>;

export const CreateCurrenciesResponseSchema = Type.Object({
  data: Type.Array(CurrencyResponseSchema),
});

export type CreateCurrencyProcessOutput = Static<typeof CreateCurrenciesResponseSchema>;
