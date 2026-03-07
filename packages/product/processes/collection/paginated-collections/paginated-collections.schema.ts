import { Type, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ProductCollectionResponseSchema } from "../retrieve-collection/retrieve-collection.schema";

export const PaginatedCollectionsSchema = createPaginationSchema(
  Type.Object({
  }),
  ["title", "handle", "created_at"],
);


export type PaginatedCollectionsProcessInput = StaticDecode<
  typeof PaginatedCollectionsSchema
>;

export const PaginatedCollectionsResponseSchema =
  createPaginatedResponseSchema(ProductCollectionResponseSchema);

export type PaginatedCollectionsProcessOutput = StaticDecode<
  typeof PaginatedCollectionsResponseSchema
>;
