import { type Static } from "@sinclair/typebox";
import { PaginationSchema, createPaginatedResponseSchema } from "@danimai/core";
import { StockLocationResponseSchema } from "../retrieve-stock-location/retrieve-stock-location.schema";

export const PaginatedStockLocationsSchema = PaginationSchema;

export type PaginatedStockLocationsProcessInput = Static<typeof PaginatedStockLocationsSchema>;

export const PaginatedStockLocationsResponseSchema = createPaginatedResponseSchema(StockLocationResponseSchema);

export type PaginatedStockLocationsProcessOutput = Static<typeof PaginatedStockLocationsResponseSchema>;
