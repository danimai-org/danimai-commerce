import { Type, type Static } from "typebox";

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
