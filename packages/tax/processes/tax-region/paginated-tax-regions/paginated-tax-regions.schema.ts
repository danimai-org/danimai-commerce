import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { TaxRegion } from "@danimai/tax/db";
import { TaxRegionResponseSchema } from "../update-tax-regions/update-tax-regions.schema";

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

export const PaginatedTaxRegionsResponseSchema =
  createPaginatedResponseSchema(TaxRegionResponseSchema);
export type PaginatedTaxRegionsProcessOutput = Static<
  typeof PaginatedTaxRegionsResponseSchema
>;
