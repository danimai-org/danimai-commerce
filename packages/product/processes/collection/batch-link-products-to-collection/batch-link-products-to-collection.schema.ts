import { Type, type Static } from "@sinclair/typebox";

export const BatchLinkProductsToCollectionSchema = Type.Object({
  product_ids: Type.Array(Type.String()),
  collection_id: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type BatchLinkProductsToCollectionProcessInput = Static<
  typeof BatchLinkProductsToCollectionSchema
>;

export const BatchLinkProductsToCollectionResponseSchema = Type.Undefined();
export type BatchLinkProductsToCollectionProcessOutput = void;
