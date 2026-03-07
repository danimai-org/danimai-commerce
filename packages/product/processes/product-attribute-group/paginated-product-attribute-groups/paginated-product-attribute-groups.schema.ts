import { Type, type Static } from "@sinclair/typebox";
import {
  PaginationSchema,
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ProductAttributeGroupResponseSchema } from "../retrieve-product-attribute-group/retrieve-product-attribute-group.schema";

const productAttributeGroupFiltersSchema = Type.Object({});

export const PaginatedProductAttributeGroupsSchema = createPaginationSchema(
  productAttributeGroupFiltersSchema,
  ["id", "title", "created_at", "updated_at", "deleted_at"],
);

const paginationQueryProperties = (PaginationSchema as unknown as {
  properties?: Record<string, unknown>;
}).properties ?? {};

/** Query-only schema for Elysia route (single Type.Object; Intersect is not supported by Elysia query validation). */
export const PaginatedProductAttributeGroupsQuerySchema = Type.Object({
  ...paginationQueryProperties,
  filters: Type.Optional(productAttributeGroupFiltersSchema),
});

export type PaginatedProductAttributeGroupsProcessInput = Static<
  typeof PaginatedProductAttributeGroupsSchema
>;

export const PaginatedProductAttributeGroupsResponseSchema =
  createPaginatedResponseSchema(ProductAttributeGroupResponseSchema);
export type PaginatedProductAttributeGroupsProcessOutput = Static<
  typeof PaginatedProductAttributeGroupsResponseSchema
>;
