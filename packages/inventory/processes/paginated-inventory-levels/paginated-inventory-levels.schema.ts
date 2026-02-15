import { type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedInventoryLevelsSchema = PaginationSchema;

export type PaginatedInventoryLevelsProcessInput = Static<
  typeof PaginatedInventoryLevelsSchema
>;
