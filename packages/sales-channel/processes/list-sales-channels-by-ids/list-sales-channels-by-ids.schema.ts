import { Type, type Static } from "@sinclair/typebox";
import { SalesChannelResponseSchema } from "../update-sales-channels/update-sales-channels.schema";

export const ListSalesChannelsByIdsSchema = Type.Object({
  ids: Type.Array(Type.String()),
});

export type ListSalesChannelsByIdsProcessInput = Static<
  typeof ListSalesChannelsByIdsSchema
>;

export const ListSalesChannelsByIdsResponseSchema = Type.Array(SalesChannelResponseSchema);
export type ListSalesChannelsByIdsProcessOutput = Static<
  typeof ListSalesChannelsByIdsResponseSchema
>;
