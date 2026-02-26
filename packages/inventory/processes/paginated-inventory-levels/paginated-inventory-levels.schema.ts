import { type Static } from "@sinclair/typebox";
import { createPaginatedResponseSchema, PaginationSchema } from "@danimai/core";
import { InventoryLevelResponseSchema } from "../get-inventory-item/get-inventory-item.schema";

export const PaginatedInventoryLevelsSchema = PaginationSchema;

export type PaginatedInventoryLevelsProcessInput = Static<
  typeof PaginatedInventoryLevelsSchema
>;

export const PaginatedInventoryLevelsResponseSchema =
  createPaginatedResponseSchema(InventoryLevelResponseSchema);
export type PaginatedInventoryLevelsProcessOutput = Static<
  typeof PaginatedInventoryLevelsResponseSchema
>;
