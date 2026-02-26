import { Type, type Static } from "@sinclair/typebox";

export const SyncProductSalesChannelsSchema = Type.Object({
  product_id: Type.String(),
  sales_channel_ids: Type.Array(Type.String()),
});

export type SyncProductSalesChannelsProcessInput = Static<
  typeof SyncProductSalesChannelsSchema
>;

export const SyncProductSalesChannelsResponseSchema = Type.Undefined();
export type SyncProductSalesChannelsProcessOutput = void;
