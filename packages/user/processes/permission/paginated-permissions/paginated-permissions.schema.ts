import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedPermissionsSchema = PaginationSchema;

export type PaginatedPermissionsProcessInput = Static<
  typeof PaginatedPermissionsSchema
>;
