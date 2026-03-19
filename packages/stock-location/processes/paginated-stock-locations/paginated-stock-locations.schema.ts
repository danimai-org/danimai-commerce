import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";

export const PaginatedStockLocationsSchema = createPaginationSchema(
  Type.Object({}),
  [
    "stock_locations.id",
    "stock_locations.name",
    "stock_locations.address_id",
    "stock_locations.created_at",
    "stock_locations.updated_at",
  ],
);

export type PaginatedStockLocationsProcessInput = StaticDecode<
  typeof PaginatedStockLocationsSchema
>;

export const StockLocationAddressSchema = Type.Object({
  address_1: Type.Union([Type.String(), Type.Null()]),
  address_2: Type.Union([Type.String(), Type.Null()]),
  company: Type.Union([Type.String(), Type.Null()]),
  city: Type.Union([Type.String(), Type.Null()]),
  province: Type.Union([Type.String(), Type.Null()]),
  postal_code: Type.Union([Type.String(), Type.Null()]),
  country_code: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
});

export const PaginatedStockLocationsResponseSchema = createPaginatedResponseSchema(Type.Object({
  id: Type.String(),
  name: Type.Union([Type.String(), Type.Null()]),
  address: StockLocationAddressSchema,
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
}));

export type PaginatedStockLocationsProcessOutput = Static<typeof PaginatedStockLocationsResponseSchema>;
