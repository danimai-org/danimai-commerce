import { type Static } from "@sinclair/typebox";
import { PaginationSchema, createPaginatedResponseSchema } from "@danimai/core";
import { ProductAttributeGroupResponseSchema } from "../retrieve-product-attribute-group/retrieve-product-attribute-group.schema";

export const PaginatedProductAttributeGroupsSchema = PaginationSchema;

export type PaginatedProductAttributeGroupsProcessInput = Static<
  typeof PaginatedProductAttributeGroupsSchema
>;

export const PaginatedProductAttributeGroupsResponseSchema =
  createPaginatedResponseSchema(ProductAttributeGroupResponseSchema);
export type PaginatedProductAttributeGroupsProcessOutput = Static<
  typeof PaginatedProductAttributeGroupsResponseSchema
>;
