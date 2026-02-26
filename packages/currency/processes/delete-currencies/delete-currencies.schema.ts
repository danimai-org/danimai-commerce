import { Type, type Static } from "@sinclair/typebox";

export const DeleteCurrenciesSchema = Type.Object({
  currency_ids: Type.Array(Type.String()),
});

export type DeleteCurrenciesProcessInput = Static<typeof DeleteCurrenciesSchema>;

export const DeleteCurrenciesResponseSchema = Type.Undefined();

export type DeleteCurrenciesProcessOutput = void;
