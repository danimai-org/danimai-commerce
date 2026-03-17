import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { TaxProviderResponseSchema } from "../update-tax-provider/update-tax-provider.schema";

export const PaginatedTaxProvidersSchema = createPaginationSchema(
  Type.Object({}),
  [
    "tax_providers.id",
    "tax_providers.name",
    "tax_providers.is_installed",
    "tax_providers.created_at",
    "tax_providers.updated_at",
  ]
);

export type PaginatedTaxProvidersProcessInput = StaticDecode<
  typeof PaginatedTaxProvidersSchema
>;

export const PaginatedTaxProvidersResponseSchema =
  createPaginatedResponseSchema(TaxProviderResponseSchema);
export type PaginatedTaxProvidersProcessOutput = Static<
  typeof PaginatedTaxProvidersResponseSchema
>;
