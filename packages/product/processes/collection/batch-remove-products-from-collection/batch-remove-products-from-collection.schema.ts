import { Type, type Static } from "@sinclair/typebox";

export const BatchRemoveProductsFromCollectionSchema = Type.Object({
  product_ids: Type.Array(Type.String()),
  collection_id: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type BatchRemoveProductsFromCollectionProcessInput = Static<
  typeof BatchRemoveProductsFromCollectionSchema
>;

export const BatchRemoveProductsFromCollectionResponseSchema = Type.Undefined();
export type BatchRemoveProductsFromCollectionProcessOutput = void;
