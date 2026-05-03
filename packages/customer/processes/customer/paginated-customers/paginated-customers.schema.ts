import { type Static } from "@sinclair/typebox";
import { PaginationSchema, createPaginatedResponseSchema } from "@danimai/core";
import { CustomerResponseSchema } from "../retrieve-customer/retrieve-customer.schema";

export const PaginatedCustomersSchema = PaginationSchema;

export type PaginatedCustomersProcessInput = Static<typeof PaginatedCustomersSchema>;

export const PaginatedCustomersResponseSchema =
  createPaginatedResponseSchema(CustomerResponseSchema);
export type PaginatedCustomersProcessOutput = Static<
  typeof PaginatedCustomersResponseSchema
>;
