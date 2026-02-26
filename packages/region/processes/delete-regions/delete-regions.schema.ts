import { Type, type Static } from "@sinclair/typebox";

export const DeleteRegionsSchema = Type.Object({
  region_ids: Type.Array(Type.String()),
});

export type DeleteRegionsProcessInput = Static<typeof DeleteRegionsSchema>;

export const DeleteRegionsResponseSchema = Type.Undefined();

export type DeleteRegionsProcessOutput = void;
