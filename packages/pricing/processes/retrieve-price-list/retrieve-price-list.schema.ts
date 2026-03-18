import { Type, type Static } from "@sinclair/typebox";

export const RetrievePriceListSchema = Type.Object({
  id: Type.String(),
});

export type RetrievePriceListProcessInput = Static<typeof RetrievePriceListSchema>;

export const PriceListResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  type: Type.Union([Type.Literal("sale"), Type.Literal("override")]),
  status: Type.Union([Type.Literal("active"), Type.Literal("draft")]),
  starts_at: Type.Union([Type.String(), Type.Null()]),
  ends_at: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export type RetrievePriceListProcessOutput = Static<typeof PriceListResponseSchema>;
