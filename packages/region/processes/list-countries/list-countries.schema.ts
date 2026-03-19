import { Type, type Static } from "@sinclair/typebox";

export const ListCountriesSchema = Type.Object({
  region_id: Type.String(),
});

export type ListCountriesProcessInput = Static<typeof ListCountriesSchema>;

export const CountryResponseSchema = Type.Object({
  id: Type.String(),
  iso_2: Type.String(),
  iso_3: Type.String(),
  num_code: Type.Number(),
  name: Type.String(),
  display_name: Type.String(),
  region_id: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const ListCountriesResponseSchema = Type.Array(CountryResponseSchema);

export type ListCountriesProcessOutput = Static<typeof ListCountriesResponseSchema>;
