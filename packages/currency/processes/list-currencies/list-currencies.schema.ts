import { Type, type Static } from "typebox";

/**
 * Danimai-style listCurrencies: list currencies with optional filters.
 */
export const ListCurrenciesSchema = Type.Object({
  code: Type.Optional(Type.String()),
  codes: Type.Optional(Type.Array(Type.String())),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0 })),
});

export type ListCurrenciesProcessInput = Static<typeof ListCurrenciesSchema>;
