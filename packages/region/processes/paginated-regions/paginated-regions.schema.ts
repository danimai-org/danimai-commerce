import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { Region } from "@danimai/region/db";
import { RegionResponseSchema } from "../update-regions/update-regions.schema";

const paginationProperties = (PaginationSchema as unknown as {
  properties?: Record<string, ReturnType<typeof Type.Any>>;
}).properties ?? {};

const regionsFiltersSchema = createFilterableColumnsSchema<
  keyof Pick<Region, "name" | "currency_code">
>({
  name: true,
  currency_code: [FilterOperator.EQUAL, FilterOperator.IN],
});

/** Flat schema for Elysia query (avoids Type.Intersect compile failure). */
export const PaginatedRegionsSchema = Type.Object({
  ...paginationProperties,
  filters: Type.Optional(regionsFiltersSchema),
});

export type PaginatedRegionsProcessInput = Static<
  typeof PaginatedRegionsSchema
>;

export const PaginatedRegionsResponseSchema = createPaginatedResponseSchema(RegionResponseSchema);

export type PaginatedRegionsProcessOutput = Static<typeof PaginatedRegionsResponseSchema>;
