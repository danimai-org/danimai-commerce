import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  createPaginationSchema,
  PaginationSchema,
} from "@danimai/core";
import type { ProductTag } from "../../../db/type";
import { ProductTagResponseSchema } from "../retrieve-product-tag/retrieve-product-tag.schema";

const productTagsFiltersSchema = createFilterableColumnsSchema<
  keyof Pick<ProductTag, "value">
>({
  value: true,
});

export const PaginatedProductTagsSchema = createPaginationSchema(
  productTagsFiltersSchema,
  ["id", "value", "created_at", "updated_at", "deleted_at"],
);

const paginationQueryProperties = (PaginationSchema as unknown as {
  properties?: Record<string, unknown>;
}).properties ?? {};

/** Query-only schema for Elysia route (single Type.Object; Intersect is not supported by Elysia query validation). */
export const PaginatedProductTagsQuerySchema = Type.Object({
  ...paginationQueryProperties,
  filters: Type.Optional(productTagsFiltersSchema),
});

export type PaginatedProductTagsProcessInput = Static<
  typeof PaginatedProductTagsSchema
>;

export const PaginatedProductTagsResponseSchema =
  createPaginatedResponseSchema(ProductTagResponseSchema);
export type PaginatedProductTagsProcessOutput = Static<
  typeof PaginatedProductTagsResponseSchema
>;
