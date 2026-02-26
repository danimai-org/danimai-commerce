import { Type, type Static } from "@sinclair/typebox";
import { createPaginatedResponseSchema, PaginationSchema } from "@danimai/core";

export const PaginatedProductsByAttributeSchema = Type.Intersect([
  Type.Object({ attribute_id: Type.String() }),
  PaginationSchema,
]);

export type PaginatedProductsByAttributeProcessInput = Static<
  typeof PaginatedProductsByAttributeSchema
>;

export const PaginatedProductsByAttributeResponseSchema =
  createPaginatedResponseSchema(Type.Any());
export type PaginatedProductsByAttributeProcessOutput = Static<
  typeof PaginatedProductsByAttributeResponseSchema
>;
