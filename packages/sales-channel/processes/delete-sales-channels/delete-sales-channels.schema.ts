import { Type, type Static } from "typebox";

export const DeleteSalesChannelsSchema = Type.Object({
  sales_channel_ids: Type.Array(Type.String()),
});

export type DeleteSalesChannelsProcessInput = Static<typeof DeleteSalesChannelsSchema>;
