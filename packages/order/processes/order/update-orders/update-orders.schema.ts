import { Type, type Static } from "@sinclair/typebox";

const OrderStatus = Type.Union([
  Type.Literal("pending"),
  Type.Literal("completed"),
  Type.Literal("archived"),
  Type.Literal("canceled"),
  Type.Literal("requires_action"),
]);

const FulfillmentStatus = Type.Union([
  Type.Literal("not_fulfilled"),
  Type.Literal("partially_fulfilled"),
  Type.Literal("fulfilled"),
  Type.Literal("partially_shipped"),
  Type.Literal("shipped"),
  Type.Literal("partially_returned"),
  Type.Literal("returned"),
  Type.Literal("canceled"),
  Type.Literal("requires_action"),
]);

const PaymentStatus = Type.Union([
  Type.Literal("not_paid"),
  Type.Literal("awaiting"),
  Type.Literal("captured"),
  Type.Literal("partially_refunded"),
  Type.Literal("refunded"),
  Type.Literal("canceled"),
  Type.Literal("requires_action"),
]);

export const UpdateOrderSchema = Type.Object({
  id: Type.String(),
  status: Type.Optional(OrderStatus),
  fulfillment_status: Type.Optional(FulfillmentStatus),
  payment_status: Type.Optional(PaymentStatus),
  email: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  customer_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  sales_channel_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  region_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  billing_address_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  shipping_address_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Type.Optional(Type.Unknown()),
});

export type UpdateOrderProcessInput = Static<typeof UpdateOrderSchema>;

export const OrderResponseSchema = Type.Object({
  id: Type.String(),
  status: OrderStatus,
  fulfillment_status: FulfillmentStatus,
  payment_status: PaymentStatus,
  display_id: Type.Number(),
  currency_code: Type.String(),
  email: Type.Union([Type.String(), Type.Null()]),
  customer_id: Type.Union([Type.String(), Type.Null()]),
  sales_channel_id: Type.Union([Type.String(), Type.Null()]),
  region_id: Type.Union([Type.String(), Type.Null()]),
  billing_address_id: Type.Union([Type.String(), Type.Null()]),
  shipping_address_id: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const UpdateOrderResponseSchema = Type.Union([
  OrderResponseSchema,
  Type.Undefined(),
]);
export type UpdateOrderProcessOutput = Static<typeof UpdateOrderResponseSchema>;
