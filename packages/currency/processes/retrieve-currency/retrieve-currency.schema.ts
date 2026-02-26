import { Type, type Static } from "@sinclair/typebox";

/**
 * Danimai-style retrieveCurrency: get a single currency by id.
 */
export const RetrieveCurrencySchema = Type.Object({
  id: Type.String(),
});

export type RetrieveCurrencyProcessInput = Static<
  typeof RetrieveCurrencySchema
>;

export const CurrencyResponseSchema = Type.Object({
  id: Type.String(),
  code: Type.String(),
  symbol: Type.String(),
  symbol_native: Type.String(),
  name: Type.String(),
  tax_inclusive_pricing: Type.Boolean(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export type CurrencyProcessOutput = Static<typeof CurrencyResponseSchema>;
