import { Type, type Static } from "@sinclair/typebox";
import { CountryResponseSchema } from "../list-countries/list-countries.schema";

export const RetrieveRegionSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveRegionProcessInput = Static<typeof RetrieveRegionSchema>;

export const RegionResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  code: Type.String(),
  currency_code: Type.String(),
  currency_symbol: Type.Union([Type.String(), Type.Null()]),
  is_active: Type.Boolean(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveRegionResponseSchema = Type.Composite([
  RegionResponseSchema,
  Type.Object({
    countries: Type.Array(CountryResponseSchema),
  }),
]);

export type RetrieveRegionProcessOutput = Static<
  typeof RetrieveRegionResponseSchema
>;
