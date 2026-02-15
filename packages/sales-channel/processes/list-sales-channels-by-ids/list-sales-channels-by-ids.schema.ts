import { Type, type Static } from "typebox";

export const ListSalesChannelsByIdsSchema = Type.Object({
  ids: Type.Array(Type.String()),
});

export type ListSalesChannelsByIdsProcessInput = Static<
  typeof ListSalesChannelsByIdsSchema
>;
