import { Type, type Static } from "typebox";

/**
 * Danimai-style retrieveCurrency: get a single currency by id.
 */
export const RetrieveCurrencySchema = Type.Object({
  id: Type.String(),
});

export type RetrieveCurrencyProcessInput = Static<
  typeof RetrieveCurrencySchema
>;
