import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export interface Database {
  inventory_items: InventoryItemTable;
  inventory_levels: InventoryLevelTable;
  reservation_items: ReservationItemTable;
}

// table inventory_items
export interface InventoryItemTable {
  id: Generated<string>;
  sku: string | null; // SKU of the item (can be null for non-shippable items)
  requires_shipping: boolean; // Whether the item requires shipping
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type InventoryItem = Selectable<InventoryItemTable>;
export type NewInventoryItem = Insertable<InventoryItemTable>;
export type InventoryItemUpdate = Updateable<InventoryItemTable>;

// table inventory_levels
export interface InventoryLevelTable {
  id: Generated<string>;
  inventory_item_id: string; // Foreign key to inventory_items
  location_id: string; // Stock location ID
  stocked_quantity: number; // Total quantity in stock
  reserved_quantity: number; // Quantity reserved/allocated
  available_quantity: number; // Available quantity (stocked - reserved)
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type InventoryLevel = Selectable<InventoryLevelTable>;
export type NewInventoryLevel = Insertable<InventoryLevelTable>;
export type InventoryLevelUpdate = Updateable<InventoryLevelTable>;

// table reservation_items
export interface ReservationItemTable {
  id: Generated<string>;
  inventory_item_id: string; // Foreign key to inventory_items
  location_id: string; // Stock location ID
  quantity: number; // Quantity being reserved
  line_item_id: string | null; // Associated line item (e.g., from cart/order)
  description: string | null; // Description of the reservation
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ReservationItem = Selectable<ReservationItemTable>;
export type NewReservationItem = Insertable<ReservationItemTable>;
export type ReservationItemUpdate = Updateable<ReservationItemTable>;
