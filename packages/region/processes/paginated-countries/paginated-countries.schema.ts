import { Type, type Static } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { CountryResponseSchema } from "../list-countries/list-countries.schema";

export const PaginatedCountriesSchema = createPaginationSchema(
  Type.Object({
    region_id: Type.Optional(Type.String()),
  }),
  ["countries.display_name", "countries.name", "countries.created_at"],
);

export type PaginatedCountriesProcessInput = Static<
  typeof PaginatedCountriesSchema
>;

export const PaginatedCountriesResponseSchema = createPaginatedResponseSchema(
  CountryResponseSchema,
);

export type PaginatedCountriesProcessOutput = Static<
  typeof PaginatedCountriesResponseSchema
>;
