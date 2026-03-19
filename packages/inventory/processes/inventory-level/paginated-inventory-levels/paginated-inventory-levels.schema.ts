import { Type, type Static } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { InventoryLevelResponseSchema } from "../update-inventory-level";

export const PaginatedInventoryLevelsSchema = createPaginationSchema(
  Type.Object({
    inventory_item_id: Type.Optional(Type.String({ format: "uuid" })),
    location_id: Type.Optional(Type.String({ format: "uuid" })),
  }),
  [
    "inventory_levels.created_at",
    "inventory_levels.updated_at",
    "inventory_levels.stocked_quantity",
    "inventory_levels.available_quantity",
  ]
);

export type PaginatedInventoryLevelsProcessInput = Static<
  typeof PaginatedInventoryLevelsSchema
>;

export const PaginatedInventoryLevelsResponseSchema =
  createPaginatedResponseSchema(InventoryLevelResponseSchema);
export type PaginatedInventoryLevelsProcessOutput = Static<
  typeof PaginatedInventoryLevelsResponseSchema
>;
