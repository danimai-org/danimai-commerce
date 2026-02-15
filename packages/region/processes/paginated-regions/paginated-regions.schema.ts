import { Type, type Static } from "typebox";
import {
  createFilterableColumnsSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { Region } from "@danimai/region/db";

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
