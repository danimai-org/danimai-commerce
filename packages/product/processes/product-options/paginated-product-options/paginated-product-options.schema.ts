import { Type, type Static } from "@sinclair/typebox";
import { createFilterableColumnsSchema, createPaginatedResponseSchema, PaginationSchema } from "@danimai/core";
import type { ProductOption } from "../../../db/type";
import { ProductOptionResponseSchema } from "../retrieve-product-option/retrieve-product-option.schema";

export const PaginatedProductOptionsSchema = Type.Intersect([PaginationSchema, Type.Object({
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductOption, "title">>({
    title: true,
  }))
})]);

export type PaginatedProductOptionsProcessInput = Static<
  typeof PaginatedProductOptionsSchema
>;

export const PaginatedProductOptionsResponseSchema =
  createPaginatedResponseSchema(ProductOptionResponseSchema);
export type PaginatedProductOptionsProcessOutput = Static<
  typeof PaginatedProductOptionsResponseSchema
>;
