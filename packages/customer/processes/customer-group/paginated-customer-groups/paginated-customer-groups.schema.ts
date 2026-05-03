import { type Static } from "@sinclair/typebox";
import { PaginationSchema, createPaginatedResponseSchema } from "@danimai/core";
import { CustomerGroupEntitySchema } from "../retrieve-customer-group/retrieve-customer-group.schema";

export const PaginatedCustomerGroupsSchema = PaginationSchema;

export type PaginatedCustomerGroupsProcessInput = Static<typeof PaginatedCustomerGroupsSchema>;

export const PaginatedCustomerGroupsResponseSchema =
  createPaginatedResponseSchema(CustomerGroupEntitySchema);
export type PaginatedCustomerGroupsProcessOutput = Static<
  typeof PaginatedCustomerGroupsResponseSchema
>;
