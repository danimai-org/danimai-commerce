import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedProductsByTagSchema = Type.Intersect([
  Type.Object({ tag_id: Type.String() }),
  PaginationSchema
]);

export type PaginatedProductsByTagProcessInput = Static<
  typeof PaginatedProductsByTagSchema
>;
