import { Type, type Static } from "@sinclair/typebox";
import { PaginationSchema, createPaginatedResponseSchema } from "@danimai/core";
import { CustomerAddressResponseSchema } from "../create-customer-address/create-customer-address.schema";

export const ListCustomerAddressesSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    customer_id: Type.String(),
  }),
]);

export type ListCustomerAddressesProcessInput = Static<
  typeof ListCustomerAddressesSchema
>;

export const ListCustomerAddressesResponseSchema =
  createPaginatedResponseSchema(CustomerAddressResponseSchema);
export type ListCustomerAddressesProcessOutput = Static<
  typeof ListCustomerAddressesResponseSchema
>;
