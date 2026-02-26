import { Type, type Static } from "@sinclair/typebox";
import { PaginationSchema } from "@danimai/core";
import { CurrencyResponseSchema } from "../retrieve-currency/retrieve-currency.schema";

/**
 * Danimai-style listAndCountCurrencies: list currencies with pagination and return count.
 */
export const ListAndCountCurrenciesSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    code: Type.Optional(Type.String()),
    codes: Type.Optional(Type.Array(Type.String())),
  }),
]);

export type ListAndCountCurrenciesProcessInput = Static<
  typeof ListAndCountCurrenciesSchema
>;

export const ListAndCountCurrenciesResponseSchema = Type.Object({
  data: Type.Array(CurrencyResponseSchema),
  count: Type.Number(),
});

export type ListAndCountCurrenciesProcessOutput = Static<typeof ListAndCountCurrenciesResponseSchema>;
