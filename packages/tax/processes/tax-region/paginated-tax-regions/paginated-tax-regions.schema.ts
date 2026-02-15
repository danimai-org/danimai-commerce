import { Type, type Static } from "typebox";
import {
  createFilterableColumnsSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { TaxRegion } from "@danimai/tax/db";

export const PaginatedTaxRegionsSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    filters: Type.Optional(
      createFilterableColumnsSchema<keyof Pick<TaxRegion, "name">>({
        name: true,
      })
    ),
  }),
]);

export type PaginatedTaxRegionsProcessInput = Static<
  typeof PaginatedTaxRegionsSchema
>;
