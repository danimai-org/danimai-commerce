import { Type, type Static } from "@sinclair/typebox";

export const DeleteRegionsSchema = Type.Object({
  ids: Type.Array(Type.String({ format: "uuid" })),
});

export type DeleteRegionsProcessInput = Static<typeof DeleteRegionsSchema>;

export const DeleteRegionsResponseSchema = Type.Undefined();

export type DeleteRegionsProcessOutput = void;
