import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedStoresSchema = PaginationSchema;

export type PaginatedStoresProcessInput = Static<typeof PaginatedStoresSchema>;
