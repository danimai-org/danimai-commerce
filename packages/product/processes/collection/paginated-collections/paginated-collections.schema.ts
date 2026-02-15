import { Type, type Static } from "typebox";
import { createFilterableColumnsSchema, FilterOperator, PaginationSchema } from "@danimai/core";
import type { ProductCollection } from "../../../db/type";

export const PaginatedCollectionsSchema = Type.Intersect([PaginationSchema, Type.Object({
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductCollection, "title" | "handle">>({
    title: true,
    handle: true,
  }))
})]);

export type PaginatedCollectionsProcessInput = Static<
  typeof PaginatedCollectionsSchema
>;
