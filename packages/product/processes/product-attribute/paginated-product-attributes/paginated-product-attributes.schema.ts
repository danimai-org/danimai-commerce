import { Type, type Static } from "@sinclair/typebox";
import { createFilterableColumnsSchema, createPaginatedResponseSchema, PaginationSchema } from "@danimai/core";
import type { ProductAttribute } from "../../../db/type";
import { ProductAttributeResponseSchema } from "../retrieve-product-attribute/retrieve-product-attribute.schema";

export const PaginatedProductAttributesSchema = Type.Intersect([PaginationSchema, Type.Object({
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductAttribute, "title" | "type">>({
    title: true,
    type: true,
  }))
})]);

export type PaginatedProductAttributesProcessInput = Static<
  typeof PaginatedProductAttributesSchema
>;

export const PaginatedProductAttributesResponseSchema =
  createPaginatedResponseSchema(ProductAttributeResponseSchema);
export type PaginatedProductAttributesProcessOutput = Static<
  typeof PaginatedProductAttributesResponseSchema
>;
