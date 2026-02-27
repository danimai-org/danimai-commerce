import { Type, type Static } from "@sinclair/typebox";

export const RetrieveCollectionSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveCollectionProcessInput = Static<
  typeof RetrieveCollectionSchema
>;

export const ProductCollectionResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  handle: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveCollectionResponseSchema = Type.Union([
  ProductCollectionResponseSchema,
  Type.Undefined(),
]);
export type RetrieveCollectionProcessOutput = Static<
  typeof RetrieveCollectionResponseSchema
>;
