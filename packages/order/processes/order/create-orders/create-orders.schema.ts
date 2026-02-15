import { Type, type Static } from "typebox";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

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

export const CreateOrderSchema = Type.Object({
  currency_code: Type.String(),
  status: Type.Optional(OrderStatus),
  fulfillment_status: Type.Optional(FulfillmentStatus),
  payment_status: Type.Optional(PaymentStatus),
  display_id: Type.Optional(Type.Integer()),
  email: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  customer_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  sales_channel_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  region_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  billing_address_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  shipping_address_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Metadata,
});

export const CreateOrdersSchema = Type.Object({
  orders: Type.Array(CreateOrderSchema),
});

export type CreateOrderProcessInput = Static<typeof CreateOrderSchema>;
export type CreateOrdersProcessInput = Static<typeof CreateOrdersSchema>;
