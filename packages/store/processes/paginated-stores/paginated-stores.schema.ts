import { type Static } from "@sinclair/typebox";
import { PaginationSchema, createPaginatedResponseSchema } from "@danimai/core";
import { StoreResponseSchema } from "../retrieve-store/retrieve-store.schema";

export const PaginatedStoresSchema = PaginationSchema;

export type PaginatedStoresProcessInput = Static<typeof PaginatedStoresSchema>;

export const PaginatedStoresResponseSchema = createPaginatedResponseSchema(StoreResponseSchema);

export type PaginatedStoresProcessOutput = Static<typeof PaginatedStoresResponseSchema>;
