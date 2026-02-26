import { Type, type Static } from "@sinclair/typebox";
import { SalesChannelResponseSchema } from "../update-sales-channels/update-sales-channels.schema";

export const GetProductSalesChannelsSchema = Type.Object({
  product_id: Type.String(),
});

export type GetProductSalesChannelsProcessInput = Static<
  typeof GetProductSalesChannelsSchema
>;

export const GetProductSalesChannelsResponseSchema = Type.Array(SalesChannelResponseSchema);
export type GetProductSalesChannelsProcessOutput = Static<
  typeof GetProductSalesChannelsResponseSchema
>;
