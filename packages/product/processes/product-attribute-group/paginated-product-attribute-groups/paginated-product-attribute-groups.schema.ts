import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  PaginationSchema,
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ProductAttributeGroupResponseSchema } from "../retrieve-product-attribute-group/retrieve-product-attribute-group.schema";

// Request/Input schema
export const PaginatedProductAttributeGroupsSchema = createPaginationSchema(
  Type.Object({}),
  ["title", "created_at"],
);

export type PaginatedProductAttributeGroupsProcessInput = StaticDecode<
  typeof PaginatedProductAttributeGroupsSchema
>;

// Response schema
export const PaginatedProductAttributeGroupsResponseSchema =
  createPaginatedResponseSchema(ProductAttributeGroupResponseSchema);
export type PaginatedProductAttributeGroupsProcessOutput = Static<
  typeof PaginatedProductAttributeGroupsResponseSchema
>;
