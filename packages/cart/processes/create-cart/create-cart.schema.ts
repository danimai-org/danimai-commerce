import { Type, type Static } from "@sinclair/typebox";
import { CartRowResponseSchema } from "../retrieve-cart/retrieve-cart.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateCartSchema = Type.Object({
  email: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  currency_code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  region_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  customer_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  session_id: Type.String({
    format: "uuid",
    description: "User session id; required to create a cart",
  }),
  metadata: Metadata,
});

export type CreateCartProcessInput = Static<typeof CreateCartSchema>;

export const CreateCartResponseSchema = Type.Union([
  CartRowResponseSchema,
  Type.Undefined(),
]);
export type CreateCartProcessOutput = Static<typeof CreateCartResponseSchema>;
