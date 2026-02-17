import { Type, type Static } from "typebox";

export const ListStockLocationsByIdsSchema = Type.Object({
  ids: Type.Array(Type.String()),
});

export type ListStockLocationsByIdsProcessInput = Static<
  typeof ListStockLocationsByIdsSchema
>;
