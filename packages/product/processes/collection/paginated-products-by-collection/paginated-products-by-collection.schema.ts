import { Type, type Static } from "@sinclair/typebox";
import {
  PaginationSchema,
  createPaginationSchema,
} from "@danimai/core";

export const PaginatedProductsByCollectionSchema = createPaginationSchema(
  Type.Object({
    collection_id: Type.String(),
  }),
  [
    "id",
    "title",
    "handle",
    "status",
    "category_id",
    "is_giftcard",
    "discountable",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
);

const paginationQueryProperties = (PaginationSchema as unknown as {
  properties?: Record<string, unknown>;
}).properties ?? {};

/** Query-only schema for Elysia route (single Type.Object; Intersect is not supported by Elysia query validation). */
export const PaginatedProductsByCollectionQuerySchema = Type.Object({
  ...paginationQueryProperties,
  collection_id: Type.String(),
});

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
