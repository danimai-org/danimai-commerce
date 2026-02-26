import { Type, type Static } from "@sinclair/typebox";
import { ProductCollectionResponseSchema } from "../retrieve-collection/retrieve-collection.schema";

export const UpdateCollectionSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  handle: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type UpdateCollectionProcessInput = Static<
  typeof UpdateCollectionSchema
>;

export const UpdateCollectionsResponseSchema = Type.Union([
  ProductCollectionResponseSchema,
  Type.Undefined(),
]);
export type UpdateCollectionsProcessOutput = Static<
  typeof UpdateCollectionsResponseSchema
>;
