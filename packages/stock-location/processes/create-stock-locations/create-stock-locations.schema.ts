import { Type, type Static } from "@sinclair/typebox";
import { StockLocationResponseSchema } from "../retrieve-stock-location/retrieve-stock-location.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]),
  ),
);

const CreateStockLocationAddressSchema = Type.Object({
  address_1: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  address_2: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  company: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  city: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  province: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  postal_code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  country_code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const CreateStockLocationSchema = Type.Object({
  name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  address_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  address: Type.Optional(CreateStockLocationAddressSchema),
  metadata: Metadata,
});

export const CreateStockLocationsSchema = Type.Object({
  stock_locations: Type.Array(CreateStockLocationSchema),
});

export type CreateStockLocationProcessInput = Static<
  typeof CreateStockLocationSchema
>;
export type CreateStockLocationsProcessInput = Static<
  typeof CreateStockLocationsSchema
>;

export const CreateStockLocationsResponseSchema = Type.Array(StockLocationResponseSchema);

export type CreateStockLocationsProcessOutput = Static<typeof CreateStockLocationsResponseSchema>;
