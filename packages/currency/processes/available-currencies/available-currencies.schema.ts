import { Type, type Static, type StaticDecode } from "@sinclair/typebox";

function coercePage(value: string | number | undefined): number {
  if (value === undefined || value === null || value === "") return 1;
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  const num = typeof n === "number" && !Number.isNaN(n) ? n : 1;
  return Math.max(1, num);
}

function coerceLimit(value: string | number | undefined): number {
  if (value === undefined || value === null || value === "") return 10;
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  const num = typeof n === "number" && !Number.isNaN(n) ? n : 10;
  return Math.max(1, Math.min(500, num));
}

export const AvailableCurrenciesSchema = Type.Object({
  page: Type.Optional(
    Type.Transform(Type.Union([Type.String(), Type.Integer()]))
      .Decode(coercePage)
      .Encode((v: number) => v ?? 1)
  ),
  limit: Type.Optional(
    Type.Transform(Type.Union([Type.String(), Type.Integer()]))
      .Decode(coerceLimit)
      .Encode((v: number) => v)
  ),
  search: Type.Optional(Type.String()),
});

export type AvailableCurrenciesProcessInput = StaticDecode<typeof AvailableCurrenciesSchema>;

const PaginationMetaSchema = Type.Object({
  total: Type.Number(),
  page: Type.Number(),
  limit: Type.Number(),
  total_pages: Type.Number(),
  has_next_page: Type.Boolean(),
  has_previous_page: Type.Boolean(),
});

export const AvailableCurrencyItemSchema = Type.Object({
  code: Type.String(),
  name: Type.String(),
  symbol: Type.String(),
  symbol_native: Type.String(),
  active: Type.Boolean(),
  id: Type.Optional(Type.String()),
  tax_inclusive_pricing: Type.Boolean(),
});

export const AvailableCurrenciesResponseSchema = Type.Object({
  data: Type.Array(AvailableCurrencyItemSchema),
  pagination: PaginationMetaSchema,
});

export type AvailableCurrenciesProcessOutput = Static<typeof AvailableCurrenciesResponseSchema>;
