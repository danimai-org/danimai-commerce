import { Type, type Static } from "@sinclair/typebox";
import { createFilterableColumnsSchema, createPaginatedResponseSchema, FilterOperator, PaginationSchema } from "@danimai/core";
import type { ProductCategory } from "../../../db/type";
import { ProductCategoryResponseSchema } from "../retrieve-product-category/retrieve-product-category.schema";

export const PaginatedProductCategoriesSchema = Type.Intersect([PaginationSchema, Type.Object({
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductCategory, "value" | "parent_id">>({
    value: true,
    parent_id: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL, FilterOperator.IS_NULL, FilterOperator.IS_NOT_NULL],
  }))
})]);

export type PaginatedProductCategoriesProcessInput = Static<
  typeof PaginatedProductCategoriesSchema
>;

export const PaginatedProductCategoriesResponseSchema =
  createPaginatedResponseSchema(ProductCategoryResponseSchema);
export type PaginatedProductCategoriesProcessOutput = Static<
  typeof PaginatedProductCategoriesResponseSchema
>;
