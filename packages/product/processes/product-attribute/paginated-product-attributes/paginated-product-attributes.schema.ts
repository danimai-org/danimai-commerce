import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ProductAttributeResponseSchema } from "../retrieve-product-attribute/retrieve-product-attribute.schema";

// Request/Input schema
export const PaginatedProductAttributesSchema = createPaginationSchema(
  Type.Object({
    attribute_group_id: Type.Optional(Type.String({ format: "uuid" })),
    group_id: Type.Optional(Type.String({ format: "uuid" })),
  }),
  ["id", "title", "type", "created_at", "updated_at", "deleted_at"],
);

export type PaginatedProductAttributesProcessInput = StaticDecode<
  typeof PaginatedProductAttributesSchema
  >;


// Response schema
export const PaginatedProductAttributesResponseSchema =
  createPaginatedResponseSchema(ProductAttributeResponseSchema);

export type PaginatedProductAttributesProcessOutput = Static<
  typeof PaginatedProductAttributesResponseSchema
>;
