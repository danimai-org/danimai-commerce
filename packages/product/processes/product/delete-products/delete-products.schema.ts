import { Type, type Static } from "@sinclair/typebox";

export const DeleteProductsSchema = Type.Object({
  product_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type DeleteProductsProcessInput = Static<
  typeof DeleteProductsSchema
>;

export const DeleteProductsResponseSchema = Type.Undefined();
export type DeleteProductsProcessOutput = void;
