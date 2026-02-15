import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedRolesSchema = PaginationSchema;

export type PaginatedRolesProcessInput = Static<typeof PaginatedRolesSchema>;
