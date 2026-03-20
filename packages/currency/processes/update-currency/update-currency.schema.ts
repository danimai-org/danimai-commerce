import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import { CurrencyResponseSchema } from "../retrieve-currency/retrieve-currency.schema";

export const UpdateCurrencyParamsSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
});

export const UpdateCurrencyBodySchema = Type.Object({
  ...UpdateCurrencyParamsSchema.properties,
  tax_inclusive_pricing: Type.Optional(Type.Boolean()),
  symbol: Type.Optional(Type.String()),
  symbol_native: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]))),
});

export type UpdateCurrencyProcessInput = StaticDecode<typeof UpdateCurrencyBodySchema>;

export const UpdateCurrencyResponseSchema = Type.Union([CurrencyResponseSchema, Type.Undefined()]);

export type UpdateCurrencyProcessOutput = Static<typeof UpdateCurrencyResponseSchema>;
