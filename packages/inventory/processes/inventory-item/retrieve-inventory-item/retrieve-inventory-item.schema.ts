import { Type, type Static } from "@sinclair/typebox";
import { InventoryLevelResponseSchema } from "../../inventory-level/update-inventory-level/update-inventory-level.schema";
import { ReservationItemResponseSchema } from "../../reservation-item/retrieve-reservation-item/retrieve-reservation-item.schema";

export const RetrieveInventoryItemSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveInventoryItemProcessInput = Static<typeof RetrieveInventoryItemSchema>;

export const InventoryItemResponseSchema = Type.Object({
  id: Type.String(),
  sku: Type.Union([Type.String(), Type.Null()]),
  requires_shipping: Type.Boolean(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const InventoryItemWithRelationsResponseSchema = Type.Composite([
  InventoryItemResponseSchema,
  Type.Object({
    inventory_levels: Type.Array(InventoryLevelResponseSchema),
    reservation_items: Type.Array(ReservationItemResponseSchema),
  }),
]);

export const RetrieveInventoryItemResponseSchema = Type.Union([
  InventoryItemWithRelationsResponseSchema,
  Type.Undefined(),
]);

export type RetrieveInventoryItemProcessOutput = Static<
  typeof RetrieveInventoryItemResponseSchema
>;
