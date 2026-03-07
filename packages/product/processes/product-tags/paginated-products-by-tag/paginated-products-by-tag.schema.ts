import { Type, type Static } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
  PaginationSchema,
} from "@danimai/core";

export const PaginatedProductsByTagSchema = createPaginationSchema(
  Type.Object({
    tag_id: Type.String(),
  }),
  [
    "id",
    "title",
    "handle",
    "status",
    "category_id",
    "created_at",
    "updated_at",
  ],
);

const paginationQueryProperties = (PaginationSchema as unknown as {
  properties?: Record<string, unknown>;
}).properties ?? {};

/** Query-only schema for Elysia route (single Type.Object; Intersect is not supported by Elysia query validation). */
export const PaginatedProductsByTagQuerySchema = Type.Object({
  ...paginationQueryProperties,
  tag_id: Type.String(),
});

export type PaginatedProductsByTagProcessInput = Static<
  typeof PaginatedProductsByTagSchema
>;

export const PaginatedProductsByTagResponseSchema =
  createPaginatedResponseSchema(Type.Any());
export type PaginatedProductsByTagProcessOutput = Static<
  typeof PaginatedProductsByTagResponseSchema
>;
