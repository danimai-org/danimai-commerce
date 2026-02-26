import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  PaginationSchema,
} from "@danimai/core";
import type { TaxProvider } from "@danimai/tax/db";
import { TaxProviderResponseSchema } from "../update-tax-providers/update-tax-providers.schema";

export const PaginatedTaxProvidersSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    filters: Type.Optional(
      createFilterableColumnsSchema<keyof Pick<TaxProvider, "name">>({
        name: true,
      })
    ),
  }),
]);

export type PaginatedTaxProvidersProcessInput = Static<
  typeof PaginatedTaxProvidersSchema
>;

export const PaginatedTaxProvidersResponseSchema =
  createPaginatedResponseSchema(TaxProviderResponseSchema);
export type PaginatedTaxProvidersProcessOutput = Static<
  typeof PaginatedTaxProvidersResponseSchema
>;
