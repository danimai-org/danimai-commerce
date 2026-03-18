import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { StockLocationResponseSchema } from "../retrieve-stock-location/retrieve-stock-location.schema";

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

export const PaginatedStockLocationsResponseSchema = createPaginatedResponseSchema(StockLocationResponseSchema);

export type PaginatedStockLocationsProcessOutput = Static<typeof PaginatedStockLocationsResponseSchema>;
