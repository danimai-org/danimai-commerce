import { Type, type Static } from "@sinclair/typebox";
import { CurrencyResponseSchema } from "../retrieve-currency/retrieve-currency.schema";

export const UpdateCurrencySchema = Type.Object({
  id: Type.String(),
  tax_inclusive_pricing: Type.Optional(Type.Boolean()),
});

export type UpdateCurrencyProcessInput = Static<typeof UpdateCurrencySchema>;

export const UpdateCurrencyResponseSchema = Type.Union([CurrencyResponseSchema, Type.Undefined()]);

export type UpdateCurrencyProcessOutput = Static<typeof UpdateCurrencyResponseSchema>;
