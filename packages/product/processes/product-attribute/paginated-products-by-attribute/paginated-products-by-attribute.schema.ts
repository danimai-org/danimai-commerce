import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedProductsByAttributeSchema = Type.Intersect([
  Type.Object({ attribute_id: Type.String() }),
  PaginationSchema,
]);

export type PaginatedProductsByAttributeProcessInput = Static<
  typeof PaginatedProductsByAttributeSchema
>;

