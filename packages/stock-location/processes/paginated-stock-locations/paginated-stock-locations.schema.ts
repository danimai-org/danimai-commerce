import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedStockLocationsSchema = PaginationSchema;

export type PaginatedStockLocationsProcessInput = Static<typeof PaginatedStockLocationsSchema>;
