import { Type, type Static } from "@sinclair/typebox";

export const DeleteSalesChannelsSchema = Type.Object({
  sales_channel_ids: Type.Array(Type.String(), { uniqueItems: true, minItems: 1 }),
});

export type DeleteSalesChannelsProcessInput = Static<typeof DeleteSalesChannelsSchema>;

export const DeleteSalesChannelsResponseSchema = Type.Undefined();
export type DeleteSalesChannelsProcessOutput = void;
