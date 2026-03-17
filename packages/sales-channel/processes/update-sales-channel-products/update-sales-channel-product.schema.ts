import { Type, type Static } from "@sinclair/typebox";

export const UpdateSalesChannelProductsSchema = Type.Object({
  product: Type.Object({
    add: Type.Array(Type.String(), { uniqueItems: true }),
    remove: Type.Array(Type.String(), { uniqueItems: true }),
  }),
  id: Type.Array(Type.String()),
});

export type UpdateSalesChannelProductsProcessInput = Static<
  typeof UpdateSalesChannelProductsSchema
>;

export const UpdateSalesChannelProductsResponseSchema = Type.Undefined();
export type UpdateSalesChannelProductsProcessOutput = void;
