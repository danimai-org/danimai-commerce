import { type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedCustomerGroupsSchema = PaginationSchema;

export type PaginatedCustomerGroupsProcessInput = Static<typeof PaginatedCustomerGroupsSchema>;
