import { Type, type Static } from "@sinclair/typebox";

export const UpdateSalesChannelSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  is_default: Type.Optional(Type.Boolean()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateSalesChannelProcessInput = Static<typeof UpdateSalesChannelSchema>;

export const SalesChannelResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  is_default: Type.Boolean(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const UpdateSalesChannelsResponseSchema = Type.Union([
  SalesChannelResponseSchema,
  Type.Undefined(),
]);
export type UpdateSalesChannelsProcessOutput = Static<
  typeof UpdateSalesChannelsResponseSchema
>;
