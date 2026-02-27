import { Type, type Static } from "@sinclair/typebox";

export const ListAvailableCurrenciesSchema = Type.Object({
  page: Type.Optional(Type.Union([Type.String(), Type.Integer()])),
  limit: Type.Optional(Type.Union([Type.String(), Type.Integer()])),
  search: Type.Optional(Type.String({ default: "" })),
});

export type ListAvailableCurrenciesProcessInput = Static<
  typeof ListAvailableCurrenciesSchema
>;

export interface AvailableCurrencyItem {
  code: string;
  name: string;
  symbol: string;
  symbol_native: string;
  active: boolean;
  id?: string;
  tax_inclusive_pricing: boolean;
}

const AvailableCurrencyItemSchema = Type.Object({
  code: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  symbol_native: Type.String(),
  active: Type.Boolean(),
  id: Type.Optional(Type.String()),
  tax_inclusive_pricing: Type.Boolean(),
});

const PaginationMetaSchema = Type.Object({
  total: Type.Number(),
  page: Type.Number(),
  limit: Type.Number(),
  total_pages: Type.Number(),
  has_next_page: Type.Boolean(),
  has_previous_page: Type.Boolean(),
});

export const ListAvailableCurrenciesResponseSchema = Type.Object({
  data: Type.Array(AvailableCurrencyItemSchema),
  pagination: PaginationMetaSchema,
});

export type ListAvailableCurrenciesProcessOutput = Static<typeof ListAvailableCurrenciesResponseSchema>;
