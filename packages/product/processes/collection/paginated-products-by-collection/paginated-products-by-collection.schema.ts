import { Type, type Static } from "@sinclair/typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedProductsByCollectionSchema = Type.Intersect([
  Type.Object({ collection_id: Type.String() }),
  PaginationSchema,
]);

export type PaginatedProductsByCollectionProcessInput = Static<
  typeof PaginatedProductsByCollectionSchema
>;

export const PaginatedProductsByCollectionResponseSchema = Type.Object({
  products: Type.Array(Type.Any()),
  count: Type.Number(),
});
export type PaginatedProductsByCollectionProcessOutput = Static<
  typeof PaginatedProductsByCollectionResponseSchema
>;
