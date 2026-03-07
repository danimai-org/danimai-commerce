import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  createPaginationSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { ProductCategory } from "../../../db/type";
import { ProductCategoryResponseSchema } from "../retrieve-product-category/retrieve-product-category.schema";

const productCategoriesFiltersSchema = createFilterableColumnsSchema<
  keyof Pick<ProductCategory, "value" | "parent_id">
>({
  value: true,
  parent_id: [
    FilterOperator.EQUAL,
    FilterOperator.NOT_EQUAL,
    FilterOperator.IS_NULL,
    FilterOperator.IS_NOT_NULL,
  ],
});

export const PaginatedProductCategoriesSchema = createPaginationSchema(
  productCategoriesFiltersSchema,
  [
    "id",
    "value",
    "parent_id",
    "status",
    "visibility",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
);

const paginationQueryProperties = (PaginationSchema as unknown as {
  properties?: Record<string, ReturnType<typeof Type.Any>>;
}).properties ?? {};

/** Query-only schema for Elysia route (single Type.Object, no Intersect). */
export const PaginatedProductCategoriesQuerySchema = Type.Object({
  ...paginationQueryProperties,
  filters: Type.Optional(productCategoriesFiltersSchema),
});

export type PaginatedProductCategoriesProcessInput = Static<
  typeof PaginatedProductCategoriesSchema
>;

export const PaginatedProductCategoriesResponseSchema =
  createPaginatedResponseSchema(ProductCategoryResponseSchema);
export type PaginatedProductCategoriesProcessOutput = Static<
  typeof PaginatedProductCategoriesResponseSchema
>;
