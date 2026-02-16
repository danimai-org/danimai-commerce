import { Type, type Static } from "typebox";

export const DeleteStockLocationsSchema = Type.Object({
  stock_location_ids: Type.Array(Type.String()),
});

export type DeleteStockLocationsProcessInput = Static<typeof DeleteStockLocationsSchema>;
