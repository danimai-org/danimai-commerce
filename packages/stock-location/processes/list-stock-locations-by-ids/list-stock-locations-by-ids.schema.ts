import { Type, type Static } from "@sinclair/typebox";

export const ListStockLocationsByIdsSchema = Type.Object({
  ids: Type.Array(Type.String()),
});

export type ListStockLocationsByIdsProcessInput = Static<
  typeof ListStockLocationsByIdsSchema
>;

const StockLocationAddressPartSchema = Type.Object({
  address_1: Type.Union([Type.String(), Type.Null()]),
  address_2: Type.Union([Type.String(), Type.Null()]),
  company: Type.Union([Type.String(), Type.Null()]),
  city: Type.Union([Type.String(), Type.Null()]),
  province: Type.Union([Type.String(), Type.Null()]),
  postal_code: Type.Union([Type.String(), Type.Null()]),
  country_code: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
});

export const StockLocationWithAddressResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.Union([Type.String(), Type.Null()]),
  address_id: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
  address: Type.Union([StockLocationAddressPartSchema, Type.Null()]),
});

export const ListStockLocationsByIdsResponseSchema = Type.Array(StockLocationWithAddressResponseSchema);

export type ListStockLocationsByIdsProcessOutput = Static<typeof ListStockLocationsByIdsResponseSchema>;
