import { Type, type Static } from "@sinclair/typebox";
import { createFilterableColumnsSchema, createPaginatedResponseSchema, PaginationSchema } from "@danimai/core";
import type { ProductTag } from "../../../db/type";
import { ProductTagResponseSchema } from "../retrieve-product-tag/retrieve-product-tag.schema";

export const PaginatedProductTagsSchema = Type.Intersect([PaginationSchema, Type.Object({
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductTag, "value">>({
    value: true,
  }))
})]);

export type PaginatedProductTagsProcessInput = Static<
  typeof PaginatedProductTagsSchema
>;

export const PaginatedProductTagsResponseSchema =
  createPaginatedResponseSchema(ProductTagResponseSchema);
export type PaginatedProductTagsProcessOutput = Static<
  typeof PaginatedProductTagsResponseSchema
>;
