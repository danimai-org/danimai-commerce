import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  createPaginationSchema,
  PaginationSchema,
} from "@danimai/core";
import type { ProductAttribute } from "../../../db/type";
import { ProductAttributeResponseSchema } from "../retrieve-product-attribute/retrieve-product-attribute.schema";

const productAttributesFiltersSchema = createFilterableColumnsSchema<
  keyof Pick<ProductAttribute, "title" | "type">
>({
  title: true,
  type: true,
});

export const PaginatedProductAttributesSchema = createPaginationSchema(
  productAttributesFiltersSchema,
  ["id", "title", "type", "created_at", "updated_at", "deleted_at"],
);

const paginationQueryProperties = (PaginationSchema as unknown as {
  properties?: Record<string, unknown>;
}).properties ?? {};

/** Query-only schema for Elysia route (single Type.Object; Intersect is not supported by Elysia query validation). */
export const PaginatedProductAttributesQuerySchema = Type.Object({
  ...paginationQueryProperties,
  filters: Type.Optional(productAttributesFiltersSchema),
});

export type PaginatedProductAttributesProcessInput = Static<
  typeof PaginatedProductAttributesSchema
>;

export const PaginatedProductAttributesResponseSchema =
  createPaginatedResponseSchema(ProductAttributeResponseSchema);
export type PaginatedProductAttributesProcessOutput = Static<
  typeof PaginatedProductAttributesResponseSchema
>;
