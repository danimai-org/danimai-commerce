import { Type, type Static } from "@sinclair/typebox";
import { OrderResponseSchema } from "../update-orders/update-orders.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateOrderFromCartSchema = Type.Object({
  cart_id: Type.String(),
  sales_channel_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Metadata,
});

export type CreateOrderFromCartProcessInput = Static<
  typeof CreateOrderFromCartSchema
>;

export const CreateOrderFromCartResponseSchema = Type.Union([
  OrderResponseSchema,
  Type.Undefined(),
]);
export type CreateOrderFromCartProcessOutput = Static<
  typeof CreateOrderFromCartResponseSchema
>;
