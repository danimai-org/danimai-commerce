import { Type, type Static } from "@sinclair/typebox";
import { RegionResponseSchema } from "../retrieve-region/retrieve-region.schema";

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

export type RegionProcessOutput = Static<typeof RegionResponseSchema>;

export const UpdateRegionResponseSchema = Type.Union([RegionResponseSchema, Type.Undefined()]);

export type UpdateRegionProcessOutput = Static<typeof UpdateRegionResponseSchema>;
