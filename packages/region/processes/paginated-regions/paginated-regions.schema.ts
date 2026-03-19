import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  createPaginationSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { Region } from "@danimai/region/db";
import { RegionResponseSchema } from "../retrieve-region/retrieve-region.schema";


/** Flat schema for Elysia query (avoids Type.Intersect compile failure). */
export const PaginatedRegionsSchema = createPaginationSchema(
  Type.Object({
    currency_code: Type.Optional(Type.String()),
  }),
  ["regions.name", "regions.currency_code"]
);

export type PaginatedRegionsProcessInput = Static<
  typeof PaginatedRegionsSchema
>;

export const PaginatedRegionsResponseSchema = createPaginatedResponseSchema(RegionResponseSchema);

export type PaginatedRegionsProcessOutput = Static<typeof PaginatedRegionsResponseSchema>;
