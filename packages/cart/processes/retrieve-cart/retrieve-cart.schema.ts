import { Type, type Static } from "@sinclair/typebox";

export const CartAddressResponseSchema = Type.Object({
  id: Type.String(),
  cart_id: Type.Union([Type.String(), Type.Null()]),
  address_1: Type.Union([Type.String(), Type.Null()]),
  address_2: Type.Union([Type.String(), Type.Null()]),
  company: Type.Union([Type.String(), Type.Null()]),
  city: Type.Union([Type.String(), Type.Null()]),
  province: Type.Union([Type.String(), Type.Null()]),
  postal_code: Type.Union([Type.String(), Type.Null()]),
  country_code: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const CartLineItemTaxLineResponseSchema = Type.Object({
  id: Type.String(),
  line_item_id: Type.Union([Type.String(), Type.Null()]),
  description: Type.Union([Type.String(), Type.Null()]),
  code: Type.Union([Type.String(), Type.Null()]),
  rate: Type.Union([Type.String(), Type.Null()]),
  provider_id: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const CartLineItemResponseSchema = Type.Object({
  id: Type.String(),
  cart_id: Type.Union([Type.String(), Type.Null()]),
  title: Type.Union([Type.String(), Type.Null()]),
  description: Type.Union([Type.String(), Type.Null()]),
  thumbnail: Type.Union([Type.String(), Type.Null()]),
  variant_id: Type.Union([Type.String(), Type.Null()]),
  product_id: Type.Union([Type.String(), Type.Null()]),
  quantity: Type.Union([Type.Integer(), Type.Null()]),
  unit_price: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
  tax_lines: Type.Array(CartLineItemTaxLineResponseSchema),
});

export const CartRowResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.Union([Type.String(), Type.Null()]),
  currency_code: Type.Union([Type.String(), Type.Null()]),
  region_id: Type.Union([Type.String(), Type.Null()]),
  customer_id: Type.Union([Type.String(), Type.Null()]),
  session_id: Type.String(),
  type: Type.Union([Type.String(), Type.Null()]),
  completed_at: Type.Union([Type.Date(), Type.String(), Type.Null()]),
  payment_authorized_at: Type.Union([Type.Date(), Type.String(), Type.Null()]),
  shipping_address_id: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveCartResponseBodySchema = Type.Intersect([
  CartRowResponseSchema,
  Type.Object({
    shipping_address: Type.Union([CartAddressResponseSchema, Type.Null()]),
    line_items: Type.Array(CartLineItemResponseSchema),
  }),
]);

export type CartWithRelations = Static<typeof RetrieveCartResponseBodySchema>;

export const RetrieveCartSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveCartProcessInput = Static<typeof RetrieveCartSchema>;

export const RetrieveCartResponseSchema = Type.Union([
  RetrieveCartResponseBodySchema,
  Type.Undefined(),
]);
export type RetrieveCartProcessOutput = Static<typeof RetrieveCartResponseSchema>;
