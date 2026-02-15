import { Type, type Static } from "typebox";
import { createFilterableColumnsSchema, FilterOperator, PaginationSchema } from "@danimai/core";
import type { ProductTag } from "../../../db/type";

export const PaginatedProductTagsSchema = Type.Intersect([PaginationSchema, Type.Object({
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductTag, "value">>({
    value: true,
  }))
})]);

export type PaginatedProductTagsProcessInput = Static<
  typeof PaginatedProductTagsSchema
>;
