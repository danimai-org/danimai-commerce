import { Type, type Static } from "@sinclair/typebox";
import { CustomerAddressResponseSchema } from "../create-customer-address/create-customer-address.schema";

export const ListCustomerAddressesSchema = Type.Object({
  customer_id: Type.String(),
});

export type ListCustomerAddressesProcessInput = Static<
  typeof ListCustomerAddressesSchema
>;

export const ListCustomerAddressesResponseSchema = Type.Array(
  CustomerAddressResponseSchema
);
export type ListCustomerAddressesProcessOutput = Static<
  typeof ListCustomerAddressesResponseSchema
>;
