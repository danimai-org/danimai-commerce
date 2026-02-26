import { Type, type Static } from "@sinclair/typebox";

export const GetInventoryItemSchema = Type.Object({
  id: Type.String(),
});

export type GetInventoryItemProcessInput = Static<
  typeof GetInventoryItemSchema
>;

export const InventoryItemResponseSchema = Type.Object({
  id: Type.String(),
  sku: Type.Union([Type.String(), Type.Null()]),
  requires_shipping: Type.Boolean(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const InventoryLevelResponseSchema = Type.Object({
  id: Type.String(),
  inventory_item_id: Type.String(),
  location_id: Type.String(),
  stocked_quantity: Type.Number(),
  reserved_quantity: Type.Number(),
  available_quantity: Type.Number(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const GetInventoryItemResponseSchema = Type.Union([
  Type.Object({
    item: InventoryItemResponseSchema,
    levels: Type.Array(InventoryLevelResponseSchema),
    reservations: Type.Array(Type.Any()),
  }),
  Type.Null(),
]);
export type GetInventoryItemProcessOutput = Static<
  typeof GetInventoryItemResponseSchema
>;
