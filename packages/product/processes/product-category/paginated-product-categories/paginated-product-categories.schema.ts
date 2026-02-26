import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  FilterOperator,
  PaginationQuerySchema,
  PaginationSchema,
} from "@danimai/core";
import type { ProductCategory } from "../../../db/type";
import { ProductCategoryResponseSchema } from "../retrieve-product-category/retrieve-product-category.schema";

const paginationQueryProperties = (PaginationQuerySchema as unknown as {
  properties?: Record<string, ReturnType<typeof Type.Any>>;
}).properties ?? {};

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

export const PaginatedProductCategoriesSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    filters: Type.Optional(productCategoriesFiltersSchema),
  }),
]);

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
