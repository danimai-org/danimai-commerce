import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { ProductCollection } from "../../../db/type";
import { ProductCollectionResponseSchema } from "../retrieve-collection/retrieve-collection.schema";

export const PaginatedCollectionsSchema = Type.Object({
  ...PaginationSchema.properties,
  search: Type.Optional(Type.String()),
  sales_channel_ids: Type.Optional(Type.Array(Type.String())),
  collection_type: Type.Optional(Type.String()),
  filters: Type.Optional(
    createFilterableColumnsSchema<
      keyof Pick<ProductCollection, "title" | "handle">
    >({
      title: true,
      handle: true,
    })
  ),
});

export type PaginatedCollectionsProcessInput = Static<
  typeof PaginatedCollectionsSchema
>;

export const PaginatedCollectionsResponseSchema =
  createPaginatedResponseSchema(ProductCollectionResponseSchema);
export type PaginatedCollectionsProcessOutput = Static<
  typeof PaginatedCollectionsResponseSchema
>;
