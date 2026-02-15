import { Type, type Static } from "typebox";

export const DeleteRegionsSchema = Type.Object({
  region_ids: Type.Array(Type.String()),
});

export type DeleteRegionsProcessInput = Static<typeof DeleteRegionsSchema>;
