import { Type, type Static } from "typebox";
import { createFilterableColumnsSchema, PaginationSchema } from "@danimai/core";
import type { ProductAttribute } from "../../../db/type";

export const PaginatedProductAttributesSchema = Type.Intersect([PaginationSchema, Type.Object({
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductAttribute, "title" | "type">>({
    title: true,
    type: true,
  }))
})]);

export type PaginatedProductAttributesProcessInput = Static<
  typeof PaginatedProductAttributesSchema
>;
