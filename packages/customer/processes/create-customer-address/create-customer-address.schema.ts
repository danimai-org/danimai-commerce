import { Type, type Static } from "@sinclair/typebox";

export const CreateCustomerAddressSchema = Type.Object({
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

export type CreateCustomerAddressProcessInput = Static<
  typeof CreateCustomerAddressSchema
>;

export const CustomerAddressResponseSchema = Type.Object({
  id: Type.String(),
  customer_id: Type.String(),
  first_name: Type.Union([Type.String(), Type.Null()]),
  last_name: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
  company: Type.Union([Type.String(), Type.Null()]),
  address_1: Type.String(),
  address_2: Type.Union([Type.String(), Type.Null()]),
  city: Type.String(),
  country_code: Type.String(),
  province: Type.Union([Type.String(), Type.Null()]),
  postal_code: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const CreateCustomerAddressResponseSchema = Type.Union([
  CustomerAddressResponseSchema,
  Type.Undefined(),
]);
export type CreateCustomerAddressProcessOutput = Static<
  typeof CreateCustomerAddressResponseSchema
>;
