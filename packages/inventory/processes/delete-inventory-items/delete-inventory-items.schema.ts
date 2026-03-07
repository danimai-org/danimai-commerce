import { Type, type Static } from "@sinclair/typebox";

export const DeleteInventoryItemsSchema = Type.Object({
  inventory_item_ids: Type.Array(Type.String()),
});

export type DeleteInventoryItemsProcessInput = Static<
  typeof DeleteInventoryItemsSchema
>;

export const DeleteInventoryItemsResponseSchema = Type.Undefined();
export type DeleteInventoryItemsProcessOutput = void;
