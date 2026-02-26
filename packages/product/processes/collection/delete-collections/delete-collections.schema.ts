import { Type, type Static } from "@sinclair/typebox";

export const DeleteCollectionsSchema = Type.Object({
  collection_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type DeleteCollectionsProcessInput = Static<
  typeof DeleteCollectionsSchema
>;

export const DeleteCollectionsResponseSchema = Type.Undefined();
export type DeleteCollectionsProcessOutput = void;
