import { Type, type Static } from "@sinclair/typebox";
import { createFilterableColumnsSchema, createPaginatedResponseSchema, FilterOperator, PaginationSchema } from "@danimai/core";
import type { ProductVariant } from "../../../db/type";
import { ProductVariantResponseSchema } from "../retrieve-product-variant/retrieve-product-variant.schema";

export const PaginatedProductVariantsSchema = Type.Intersect([PaginationSchema, Type.Object({
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductVariant, "title" | "sku" | "product_id">>({
    title: true,
    sku: true,
    product_id: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL, FilterOperator.IS_NULL, FilterOperator.IS_NOT_NULL],
  }))
})]);

export type PaginatedProductVariantsProcessInput = Static<
  typeof PaginatedProductVariantsSchema
>;

export const PaginatedProductVariantsResponseSchema =
  createPaginatedResponseSchema(ProductVariantResponseSchema);
export type PaginatedProductVariantsProcessOutput = Static<
  typeof PaginatedProductVariantsResponseSchema
>;
