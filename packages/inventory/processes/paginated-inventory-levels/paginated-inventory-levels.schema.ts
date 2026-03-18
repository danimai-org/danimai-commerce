import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { InventoryLevelResponseSchema } from "../get-inventory-item/get-inventory-item.schema";

export const PaginatedInventoryLevelsSchema = createPaginationSchema(
  Type.Object({}),
  [
    "inventory_levels.id",
    "inventory_levels.inventory_item_id",
    "inventory_levels.location_id",
    "inventory_levels.stocked_quantity",
    "inventory_levels.reserved_quantity",
    "inventory_levels.available_quantity",
    "inventory_levels.created_at",
    "inventory_levels.updated_at",
  ],
);

export type PaginatedInventoryLevelsProcessInput = StaticDecode<
  typeof PaginatedInventoryLevelsSchema
>;

export const PaginatedInventoryLevelsResponseSchema =
  createPaginatedResponseSchema(InventoryLevelResponseSchema);
export type PaginatedInventoryLevelsProcessOutput = Static<
  typeof PaginatedInventoryLevelsResponseSchema
>;
