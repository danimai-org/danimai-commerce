import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ProductTagResponseSchema } from "../retrieve-product-tag/retrieve-product-tag.schema";

export const PaginatedProductTagsSchema = createPaginationSchema(
  Type.Object({}),
  ["value", "created_at"],
);

// Request/Input schema
export type PaginatedProductTagsProcessInput = StaticDecode<
  typeof PaginatedProductTagsSchema
>;

// Response schema
export const PaginatedProductTagsResponseSchema =
  createPaginatedResponseSchema(ProductTagResponseSchema);
export type PaginatedProductTagsProcessOutput = Static<
  typeof PaginatedProductTagsResponseSchema
>;
