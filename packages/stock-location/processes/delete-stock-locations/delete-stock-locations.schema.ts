import { Type, type Static } from "@sinclair/typebox";

export const DeleteStockLocationsSchema = Type.Object({
  stock_location_ids: Type.Array(Type.String()),
});

export type DeleteStockLocationsProcessInput = Static<typeof DeleteStockLocationsSchema>;

export const DeleteStockLocationsResponseSchema = Type.Undefined();

export type DeleteStockLocationsProcessOutput = void;
