import { Type, type Static } from "@sinclair/typebox";

export const DeleteStockLocationsSchema = Type.Object({
  ids: Type.Array(Type.String({ format: "uuid" }), { uniqueItems: true, minItems: 1 }),
});

export type DeleteStockLocationsProcessInput = Static<typeof DeleteStockLocationsSchema>;

export const DeleteStockLocationsResponseSchema = Type.Undefined();

export type DeleteStockLocationsProcessOutput = void;
