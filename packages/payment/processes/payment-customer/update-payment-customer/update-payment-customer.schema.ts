import { Type, type Static } from "@sinclair/typebox";

const StripeMetadata = Type.Optional(
  Type.Record(Type.String(), Type.String())
);

const StripeAddress = Type.Optional(
  Type.Object({
    line1: Type.Optional(Type.String()),
    line2: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    state: Type.Optional(Type.String()),
    postal_code: Type.Optional(Type.String()),
    country: Type.Optional(Type.String()),
  })
);

const StripeShipping = Type.Optional(
  Type.Object({
    name: Type.Optional(Type.String()),
    phone: Type.Optional(Type.String()),
    address: StripeAddress,
  })
);

export const StripeCustomerFieldsSchema = {
  email: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  phone: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  metadata: StripeMetadata,
  address: StripeAddress,
  shipping: StripeShipping,
  tax_exempt: Type.Optional(
    Type.Union([
      Type.Literal("none"),
      Type.Literal("exempt"),
      Type.Literal("reverse"),
    ])
  ),
  preferred_locales: Type.Optional(Type.Array(Type.String())),
};

export const UpdatePaymentCustomerSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  status: Type.Optional(
    Type.Union([Type.Literal("active"), Type.Literal("cancelled")])
  ),
  ...StripeCustomerFieldsSchema,
});

export type UpdatePaymentCustomerProcessInput = Static<
  typeof UpdatePaymentCustomerSchema
>;

export const PaymentCustomerResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  customer_id: Type.String(),
  stripe_customer_id: Type.String(),
  provider_id: Type.String({ format: "uuid" }),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  status: Type.Union([Type.Literal("active"), Type.Literal("cancelled")]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const UpdatePaymentCustomerResponseSchema = Type.Union([
  PaymentCustomerResponseSchema,
  Type.Undefined(),
]);
export type UpdatePaymentCustomerProcessOutput = Static<
  typeof UpdatePaymentCustomerResponseSchema
>;
