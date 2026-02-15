import { Type, type Static } from "typebox";
import { createFilterableColumnsSchema, FilterOperator, PaginationSchema } from "@danimai/core";
import type { ProductOption } from "../../../db/type";

export const PaginatedProductOptionsSchema = Type.Intersect([PaginationSchema, Type.Object({
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductOption, "title">>({
    title: true,
  }))
})]);

export type PaginatedProductOptionsProcessInput = Static<
  typeof PaginatedProductOptionsSchema
>;
