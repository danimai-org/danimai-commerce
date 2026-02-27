import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { TaxRegion } from "@danimai/tax/db";
import { TaxRegionResponseSchema } from "../update-tax-regions/update-tax-regions.schema";

const paginationProperties = (PaginationSchema as unknown as {
  properties?: Record<string, ReturnType<typeof Type.Any>>;
}).properties ?? {};

const taxRegionsFiltersSchema = createFilterableColumnsSchema<
  keyof Pick<TaxRegion, "name">
>({ name: true });

/** Flat schema for Elysia query (avoids Type.Intersect compile failure). */
export const PaginatedTaxRegionsSchema = Type.Object({
  ...paginationProperties,
  filters: Type.Optional(taxRegionsFiltersSchema),
});

export type PaginatedTaxRegionsProcessInput = Static<
  typeof PaginatedTaxRegionsSchema
>;

export const PaginatedTaxRegionsResponseSchema =
  createPaginatedResponseSchema(TaxRegionResponseSchema);
export type PaginatedTaxRegionsProcessOutput = Static<
  typeof PaginatedTaxRegionsResponseSchema
>;
