import { Type, type Static } from "@sinclair/typebox";
import { CustomerAddressResponseSchema } from "../create-customer-address/create-customer-address.schema";

export const DeleteCustomerAddressSchema = Type.Object({
  id: Type.String(),
  customer_id: Type.String(),
});

export type DeleteCustomerAddressProcessInput = Static<
  typeof DeleteCustomerAddressSchema
>;

export const DeleteCustomerAddressResponseSchema = Type.Union([
  CustomerAddressResponseSchema,
  Type.Undefined(),
]);
export type DeleteCustomerAddressProcessOutput = Static<
  typeof DeleteCustomerAddressResponseSchema
>;
