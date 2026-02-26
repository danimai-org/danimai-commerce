import { Type, type Static } from "@sinclair/typebox";
import { PaginationSchema, createPaginatedResponseSchema } from "@danimai/core";
import { CustomerResponseSchema } from "../retrieve-customer/retrieve-customer.schema";

export const ListCustomersInGroupSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    customer_group_id: Type.String(),
  }),
]);

export type ListCustomersInGroupProcessInput = Static<
  typeof ListCustomersInGroupSchema
>;

export const ListCustomersInGroupResponseSchema =
  createPaginatedResponseSchema(CustomerResponseSchema);
export type ListCustomersInGroupProcessOutput = Static<
  typeof ListCustomersInGroupResponseSchema
>;
