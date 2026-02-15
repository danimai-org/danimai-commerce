import { type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedInventoryItemsSchema = PaginationSchema;

export type PaginatedInventoryItemsProcessInput = Static<
  typeof PaginatedInventoryItemsSchema
>;
