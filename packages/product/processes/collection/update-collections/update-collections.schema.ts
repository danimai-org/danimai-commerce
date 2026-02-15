import { Type, type Static } from "typebox";

export const UpdateCollectionSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  handle: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type UpdateCollectionProcessInput = Static<
  typeof UpdateCollectionSchema
>;
