import { Type, type Static } from "typebox";

export const GetProductSalesChannelsSchema = Type.Object({
  product_id: Type.String(),
});

export type GetProductSalesChannelsProcessInput = Static<
  typeof GetProductSalesChannelsSchema
>;
