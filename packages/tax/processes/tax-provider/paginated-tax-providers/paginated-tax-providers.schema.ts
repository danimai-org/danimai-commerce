import { Type, type Static } from "typebox";
import {
  createFilterableColumnsSchema,
  PaginationSchema,
} from "@danimai/core";
import type { TaxProvider } from "@danimai/tax/db";

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
