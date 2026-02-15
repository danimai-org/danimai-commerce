import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedUsersSchema = PaginationSchema;

export type PaginatedUsersProcessInput = Static<typeof PaginatedUsersSchema>;
