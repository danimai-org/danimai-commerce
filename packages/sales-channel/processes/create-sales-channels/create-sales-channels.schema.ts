import { Type, type Static } from "@sinclair/typebox";
import { SalesChannelResponseSchema } from "../update-sales-channels/update-sales-channels.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateSalesChannelSchema = Type.Object({
  name: Type.String(),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  is_default: Type.Optional(Type.Boolean()),
  metadata: Metadata,
});

export const CreateSalesChannelsSchema = Type.Object({
  sales_channels: Type.Array(CreateSalesChannelSchema),
});

export type CreateSalesChannelProcessInput = Static<typeof CreateSalesChannelSchema>;
export type CreateSalesChannelsProcessInput = Static<typeof CreateSalesChannelsSchema>;

export const CreateSalesChannelsResponseSchema = Type.Array(SalesChannelResponseSchema);
export type CreateSalesChannelsProcessOutput = Static<
  typeof CreateSalesChannelsResponseSchema
>;
