import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedProductsByCollectionSchema = Type.Intersect([
  Type.Object({ collection_id: Type.String() }),
  PaginationSchema,
]);

export type PaginatedProductsByCollectionProcessInput = Static<
  typeof PaginatedProductsByCollectionSchema
>;
