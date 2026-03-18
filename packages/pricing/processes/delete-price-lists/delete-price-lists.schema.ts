import { Type, type Static } from "@sinclair/typebox";

export const DeletePriceListsSchema = Type.Object({
  ids: Type.Array(Type.String()),
});

export type DeletePriceListsProcessInput = Static<typeof DeletePriceListsSchema>;

export const DeletePriceListsResponseSchema = Type.Undefined();
export type DeletePriceListsProcessOutput = void;
