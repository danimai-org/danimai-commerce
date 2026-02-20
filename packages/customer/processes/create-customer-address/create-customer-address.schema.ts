import { Type, type Static } from "typebox";

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
