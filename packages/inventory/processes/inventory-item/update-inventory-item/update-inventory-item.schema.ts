import { Type, type Static } from "@sinclair/typebox";
import { InventoryItemResponseSchema } from "../retrieve-inventory-item/retrieve-inventory-item.schema";

export const UpdateInventoryItemSchema = Type.Object({
  id: Type.String(),
  sku: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  requires_shipping: Type.Optional(Type.Boolean()),
  metadata: Type.Optional(
    Type.Union([
      Type.Record(
        Type.String(),
        Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
      ),
      Type.Null(),
    ])
  ),
});

export type UpdateInventoryItemProcessInput = Static<
  typeof UpdateInventoryItemSchema
>;

export const UpdateInventoryItemResponseSchema = Type.Union([
  InventoryItemResponseSchema,
  Type.Undefined(),
]);
export type UpdateInventoryItemProcessOutput = Static<
  typeof UpdateInventoryItemResponseSchema
>;
