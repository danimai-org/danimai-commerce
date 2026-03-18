import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { InventoryItemResponseSchema } from "../get-inventory-item/get-inventory-item.schema";

export const PaginatedInventoryItemsSchema = createPaginationSchema(
  Type.Object({}),
  [
    "inventory_items.id",
    "inventory_items.sku",
    "inventory_items.requires_shipping",
    "inventory_items.created_at",
    "inventory_items.updated_at",
  ],
);

export type PaginatedInventoryItemsProcessInput = StaticDecode<
  typeof PaginatedInventoryItemsSchema
>;

export const PaginatedInventoryItemsResponseSchema =
  createPaginatedResponseSchema(InventoryItemResponseSchema);
export type PaginatedInventoryItemsProcessOutput = Static<
  typeof PaginatedInventoryItemsResponseSchema
>;
