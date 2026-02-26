import { type Static } from "@sinclair/typebox";
import { createPaginatedResponseSchema, PaginationSchema } from "@danimai/core";
import { InventoryItemResponseSchema } from "../get-inventory-item/get-inventory-item.schema";

export const PaginatedInventoryItemsSchema = PaginationSchema;

export type PaginatedInventoryItemsProcessInput = Static<
  typeof PaginatedInventoryItemsSchema
>;

export const PaginatedInventoryItemsResponseSchema =
  createPaginatedResponseSchema(InventoryItemResponseSchema);
export type PaginatedInventoryItemsProcessOutput = Static<
  typeof PaginatedInventoryItemsResponseSchema
>;
