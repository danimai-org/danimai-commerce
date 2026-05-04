import { Type, type Static } from "@sinclair/typebox";
import { CustomerAddressResponseSchema } from "../create-customer-address/create-customer-address.schema";

export const UpdateCustomerAddressSchema = Type.Object({
  id: Type.String(),
  customer_id: Type.String(),
  first_name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  last_name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  company: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  address_1: Type.String(),
  address_2: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  city: Type.String(),
  country_code: Type.String(),
  province: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  postal_code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type UpdateCustomerAddressProcessInput = Static<
  typeof UpdateCustomerAddressSchema
>;

export const UpdateCustomerAddressResponseSchema = Type.Union([
  CustomerAddressResponseSchema,
  Type.Undefined(),
]);
export type UpdateCustomerAddressProcessOutput = Static<
  typeof UpdateCustomerAddressResponseSchema
>;
