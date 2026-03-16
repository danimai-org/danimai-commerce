import { Type, type Static } from "@sinclair/typebox";
import { ProductCollectionResponseSchema } from "../retrieve-collection/retrieve-collection.schema";

export const CreateCollectionSchema = Type.Object({
  title: Type.String({ examples: ["Best Sellers"] }),
  handle: Type.Optional(Type.String({ examples: ["best-sellers"] })),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateCollectionProcessInput = Static<
  typeof CreateCollectionSchema
>;

export const CreateCollectionResponseSchema = Type.Union([
  ProductCollectionResponseSchema,
  Type.Undefined(),
]);
export type CreateCollectionProcessOutput = Static<
  typeof CreateCollectionResponseSchema
>;
