import { Type, type Static } from "@sinclair/typebox";

export const DeleteInventoryItemsSchema = Type.Object({
  ids: Type.Array(Type.String(), { uniqueItems: true, minItems: 1 }),
});

export type DeleteInventoryItemsProcessInput = Static<
  typeof DeleteInventoryItemsSchema
>;

export const DeleteInventoryItemsResponseSchema = Type.Undefined();
export type DeleteInventoryItemsProcessOutput = void;
