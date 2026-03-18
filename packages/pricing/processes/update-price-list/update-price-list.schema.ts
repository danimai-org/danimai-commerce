import { Type, type Static } from "@sinclair/typebox";
import { PriceListResponseSchema } from "../retrieve-price-list/retrieve-price-list.schema";

export const UpdatePriceListSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String({ minLength: 1 })),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  type: Type.Optional(Type.Union([Type.Literal("sale"), Type.Literal("override")])),
  status: Type.Optional(Type.Union([Type.Literal("active"), Type.Literal("draft")])),
  starts_at: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  ends_at: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Type.Optional(Type.Union([Type.Unknown(), Type.Null()])),
});

export type UpdatePriceListProcessInput = Static<typeof UpdatePriceListSchema>;

export const UpdatePriceListResponseSchema = Type.Union([
  PriceListResponseSchema,
  Type.Null(),
]);
export type UpdatePriceListProcessOutput = Static<typeof UpdatePriceListResponseSchema>;
