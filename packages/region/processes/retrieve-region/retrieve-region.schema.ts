import { Type, type Static } from "@sinclair/typebox";

export const RetrieveRegionSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveRegionProcessInput = Static<typeof RetrieveRegionSchema>;

export const RegionResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  currency_code: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveRegionResponseSchema = Type.Union([
  RegionResponseSchema,
  Type.Undefined(),
]);

export type RetrieveRegionProcessOutput = Static<
  typeof RetrieveRegionResponseSchema
>;
