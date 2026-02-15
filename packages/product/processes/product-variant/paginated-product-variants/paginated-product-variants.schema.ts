import { Type, type Static } from "typebox";
import { createFilterableColumnsSchema, FilterOperator, PaginationSchema } from "@danimai/core";
import type { ProductVariant } from "../../../db/type";

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
