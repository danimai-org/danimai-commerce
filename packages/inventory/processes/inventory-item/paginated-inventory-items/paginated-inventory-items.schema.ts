import { Type, type Static } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { InventoryItemResponseSchema } from "../retrieve-inventory-item/retrieve-inventory-item.schema";

export const PaginatedInventoryItemsSchema = createPaginationSchema(
  Type.Object({
    sku: Type.Optional(Type.String()),
    requires_shipping: Type.Optional(Type.Boolean()),
  }),
  [
    "inventory_items.created_at",
    "inventory_items.updated_at",
    "inventory_items.sku",
  ]
);

export type PaginatedInventoryItemsProcessInput = Static<
  typeof PaginatedInventoryItemsSchema
>;

export const PaginatedInventoryItemsResponseSchema =
  createPaginatedResponseSchema(InventoryItemResponseSchema);
export type PaginatedInventoryItemsProcessOutput = Static<
  typeof PaginatedInventoryItemsResponseSchema
>;
