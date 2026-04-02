import { Type, type Static } from "@sinclair/typebox";
import { RetrieveCartResponseSchema } from "../retrieve-cart/retrieve-cart.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const UpdateCartShippingAddressSchema = Type.Object({
  address_1: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  address_2: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  company: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  city: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  province: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  postal_code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  country_code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Metadata,
});

export const UpdateCartAddressesSchema = Type.Object({
  id: Type.String(),
  shipping_address: UpdateCartShippingAddressSchema,
});

export type UpdateCartAddressesProcessInput = Static<
  typeof UpdateCartAddressesSchema
>;

export type UpdateCartAddressesProcessOutput = Static<
  typeof RetrieveCartResponseSchema
>;
