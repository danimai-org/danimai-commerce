import { Type, type Static } from "typebox";
import { createFilterableColumnsSchema, FilterOperator, PaginationSchema } from "@danimai/core";
import type { ProductCategory } from "../../../db/type";

export const PaginatedProductCategoriesSchema = Type.Intersect([PaginationSchema, Type.Object({
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductCategory, "value" | "parent_id">>({
    value: true,
    parent_id: [FilterOperator.EQUAL, FilterOperator.NOT_EQUAL, FilterOperator.IS_NULL, FilterOperator.IS_NOT_NULL],
  }))
})]);

export type PaginatedProductCategoriesProcessInput = Static<
  typeof PaginatedProductCategoriesSchema
>;
