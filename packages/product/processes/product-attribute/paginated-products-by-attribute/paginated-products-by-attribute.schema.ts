import { Type, type Static } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
  PaginationSchema,
} from "@danimai/core";

export const PaginatedProductsByAttributeSchema = createPaginationSchema(
  Type.Object({
    attribute_id: Type.String(),
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
export const PaginatedProductsByAttributeQuerySchema = Type.Object({
  ...paginationQueryProperties,
  attribute_id: Type.String(),
});

export type PaginatedProductsByAttributeProcessInput = Static<
  typeof PaginatedProductsByAttributeSchema
>;

export const PaginatedProductsByAttributeResponseSchema =
  createPaginatedResponseSchema(Type.Any());
export type PaginatedProductsByAttributeProcessOutput = Static<
  typeof PaginatedProductsByAttributeResponseSchema
>;
