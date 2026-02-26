import { Type, type Static } from "@sinclair/typebox";

export const UpdateRegionSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  currency_code: Type.Optional(Type.String()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateRegionProcessInput = Static<typeof UpdateRegionSchema>;

export const RegionResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  currency_code: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export type RegionProcessOutput = Static<typeof RegionResponseSchema>;

export const UpdateRegionResponseSchema = Type.Union([RegionResponseSchema, Type.Undefined()]);

export type UpdateRegionProcessOutput = Static<typeof UpdateRegionResponseSchema>;
