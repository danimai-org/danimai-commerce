import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

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
