import { Type, type Static } from "@sinclair/typebox";
import { ProductCollectionResponseSchema } from "../retrieve-collection/retrieve-collection.schema";

export const CreateCollectionSchema = Type.Object({
  title: Type.String(),
  handle: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateCollectionProcessInput = Static<
  typeof CreateCollectionSchema
>;

export const CreateCollectionsResponseSchema = Type.Union([
  ProductCollectionResponseSchema,
  Type.Undefined(),
]);
export type CreateCollectionsProcessOutput = Static<
  typeof CreateCollectionsResponseSchema
>;
