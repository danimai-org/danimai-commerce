import { Type, type Static } from "typebox";

export const CreateRegionSchema = Type.Object({
  name: Type.String(),
  currency_code: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]))),
});

export const CreateRegionsSchema = Type.Object({
  regions: Type.Array(CreateRegionSchema),
});

export type CreateRegionProcessInput = Static<typeof CreateRegionSchema>;
export type CreateRegionsProcessInput = Static<typeof CreateRegionsSchema>;
