import { Type, type Static } from "@sinclair/typebox";
import { RegionResponseSchema } from "../retrieve-region";

export const CreateRegionSchema = Type.Object({
  name: Type.String(),
  currency_code: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]))),
});

export type CreateRegionProcessInput = Static<typeof CreateRegionSchema>;

export const CreateRegionResponseSchema = Type.Union([RegionResponseSchema]);
export type CreateRegionProcessOutput = Static<typeof CreateRegionResponseSchema>;
