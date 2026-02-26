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
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const RetrieveCollectionResponseSchema = Type.Union([
  ProductCollectionResponseSchema,
  Type.Undefined(),
]);
export type RetrieveCollectionProcessOutput = Static<
  typeof RetrieveCollectionResponseSchema
>;
