import { Type, type Static } from "@sinclair/typebox";
import { RetrieveCartResponseSchema } from "../retrieve-cart/retrieve-cart.schema";

const Metadata = Type.Optional(
  Type.Record(Type.String(), Type.Unknown())
);

export const UpdateCartLineItemInputSchema = Type.Object({
  id: Type.Optional(Type.String()),
  title: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  thumbnail: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  variant_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  product_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  quantity: Type.Optional(Type.Union([Type.Integer(), Type.Null()])),
  unit_price: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Metadata,
});

export const UpdateCartLineItemsSchema = Type.Object({
  id: Type.String(),
  line_items: Type.Array(UpdateCartLineItemInputSchema),
});

export type UpdateCartLineItemsProcessInput = Static<
  typeof UpdateCartLineItemsSchema
>;

export type UpdateCartLineItemsProcessOutput = Static<
  typeof RetrieveCartResponseSchema
>;
