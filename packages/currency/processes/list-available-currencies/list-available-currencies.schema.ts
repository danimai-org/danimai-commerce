import { Type, type Static } from "typebox";

export const ListAvailableCurrenciesSchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
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
