import { Type, type Static } from "@sinclair/typebox";
import { createPaginatedResponseSchema, PaginationSchema } from "@danimai/core";

export const PaginatedProductsByTagSchema = Type.Intersect([
  Type.Object({ tag_id: Type.String() }),
  PaginationSchema
]);

export type PaginatedProductsByTagProcessInput = Static<
  typeof PaginatedProductsByTagSchema
>;

export const PaginatedProductsByTagResponseSchema =
  createPaginatedResponseSchema(Type.Any());
export type PaginatedProductsByTagProcessOutput = Static<
  typeof PaginatedProductsByTagResponseSchema
>;
