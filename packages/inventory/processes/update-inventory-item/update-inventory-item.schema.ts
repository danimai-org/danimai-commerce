import { Type, type Static } from "@sinclair/typebox";
import { InventoryItemResponseSchema } from "../get-inventory-item/get-inventory-item.schema";

export const UpdateInventoryItemSchema = Type.Object({
  id: Type.String(),
  sku: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  requires_shipping: Type.Optional(Type.Boolean()),
});

export type UpdateInventoryItemProcessInput = Static<
  typeof UpdateInventoryItemSchema
>;

export const UpdateInventoryItemResponseSchema = Type.Union([
  InventoryItemResponseSchema,
  Type.Null(),
]);
export type UpdateInventoryItemProcessOutput = Static<
  typeof UpdateInventoryItemResponseSchema
>;
