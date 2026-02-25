import { type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedProductAttributeGroupsSchema = PaginationSchema;

export type PaginatedProductAttributeGroupsProcessInput = Static<
  typeof PaginatedProductAttributeGroupsSchema
>;
