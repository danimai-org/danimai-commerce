import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ProductCategoryResponseSchema } from "../retrieve-product-category/retrieve-product-category.schema";

// Request/Input schema
export const PaginatedProductCategoriesSchema = createPaginationSchema(
  Type.Object({}),
  [
    "value",
    "created_at",
  ],
);

export type PaginatedProductCategoriesProcessInput = StaticDecode<
  typeof PaginatedProductCategoriesSchema
>;

// Response schema
export const PaginatedProductCategoriesResponseSchema =
  createPaginatedResponseSchema(ProductCategoryResponseSchema);
export type PaginatedProductCategoriesProcessOutput = Static<
  typeof PaginatedProductCategoriesResponseSchema
>;
