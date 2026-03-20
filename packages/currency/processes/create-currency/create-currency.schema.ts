import { Type, type Static } from "@sinclair/typebox";
import { CurrencyResponseSchema } from "../retrieve-currency/retrieve-currency.schema";

export const CreateCurrencySchema = Type.Object({
  name: Type.String(),
  code: Type.String(),
  tax_inclusive_pricing: Type.Boolean({ default: false }),
});


export type CreateCurrencyInput = Static<typeof CreateCurrencySchema>;

export const CreateCurrencyResponseSchema = CurrencyResponseSchema;

export type CreateCurrencyProcessOutput = Static<typeof CreateCurrencyResponseSchema>;
