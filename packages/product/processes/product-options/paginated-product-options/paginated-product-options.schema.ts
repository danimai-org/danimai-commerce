import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ProductOptionResponseSchema } from "../retrieve-product-option/retrieve-product-option.schema";

// Request/Input schema
export const PaginatedProductOptionsSchema = createPaginationSchema(
  Type.Object({}),
  ["title", "created_at"],
);

export type PaginatedProductOptionsProcessInput = StaticDecode<
  typeof PaginatedProductOptionsSchema
>;

// Response schema
export const PaginatedProductOptionsResponseSchema =
  createPaginatedResponseSchema(ProductOptionResponseSchema);
export type PaginatedProductOptionsProcessOutput = Static<
  typeof PaginatedProductOptionsResponseSchema
>;
