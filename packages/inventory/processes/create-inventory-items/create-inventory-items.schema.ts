import { Type, type Static } from "@sinclair/typebox";
import { InventoryItemResponseSchema } from "../get-inventory-item/get-inventory-item.schema";

export const CreateInventoryItemSchema = Type.Object({
  sku: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  requires_shipping: Type.Optional(Type.Boolean()),
});

export const CreateInventoryItemsSchema = Type.Object({
  inventory_items: Type.Array(CreateInventoryItemSchema),
});

export type CreateInventoryItemProcessInput = Static<
  typeof CreateInventoryItemSchema
>;
export type CreateInventoryItemsProcessInput = Static<
  typeof CreateInventoryItemsSchema
>;

export const CreateInventoryItemsResponseSchema = Type.Array(InventoryItemResponseSchema);
export type CreateInventoryItemsProcessOutput = Static<
  typeof CreateInventoryItemsResponseSchema
>;
