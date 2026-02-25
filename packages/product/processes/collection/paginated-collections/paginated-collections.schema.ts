import { Type, type Static } from "typebox";
import { createFilterableColumnsSchema, FilterOperator, PaginationSchema } from "@danimai/core";
import type { ProductCollection } from "../../../db/type";

export const PaginatedCollectionsSchema = Type.Intersect([PaginationSchema, Type.Object({
  search: Type.Optional(Type.String()),
  sales_channel_ids: Type.Optional(Type.Array(Type.String())),
  collection_type: Type.Optional(Type.String()),
  filters: Type.Optional(createFilterableColumnsSchema<keyof Pick<ProductCollection, "title" | "handle">>({
    title: true,
    handle: true,
  }))
})]);

export type PaginatedCollectionsProcessInput = Static<
  typeof PaginatedCollectionsSchema
>;
