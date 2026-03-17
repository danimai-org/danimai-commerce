import { Type, type Static } from "@sinclair/typebox";

export const RetrieveSalesChannelSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveSalesChannelProcessInput = Static<
  typeof RetrieveSalesChannelSchema
>;

export const SalesChannelResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  is_default: Type.Boolean(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveSalesChannelResponseSchema = Type.Union([
  SalesChannelResponseSchema,
  Type.Undefined(),
]);
export type RetrieveSalesChannelProcessOutput = Static<
  typeof RetrieveSalesChannelResponseSchema
>;
