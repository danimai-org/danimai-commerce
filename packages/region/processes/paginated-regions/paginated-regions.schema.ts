import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { Region } from "@danimai/region/db";
import { RegionResponseSchema } from "../update-regions/update-regions.schema";

export const PaginatedRegionsSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    filters: Type.Optional(
      createFilterableColumnsSchema<
        keyof Pick<Region, "name" | "currency_code">
      >({
        name: true,
        currency_code: [FilterOperator.EQUAL, FilterOperator.IN],
      })
    ),
  }),
]);

export type PaginatedRegionsProcessInput = Static<
  typeof PaginatedRegionsSchema
>;

export const PaginatedRegionsResponseSchema = createPaginatedResponseSchema(RegionResponseSchema);

export type PaginatedRegionsProcessOutput = Static<typeof PaginatedRegionsResponseSchema>;
