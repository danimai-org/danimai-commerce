import { Type, type Static } from "typebox";

export const CreateCollectionSchema = Type.Object({
  title: Type.String(),
  handle: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateCollectionProcessInput = Static<
  typeof CreateCollectionSchema
>;
