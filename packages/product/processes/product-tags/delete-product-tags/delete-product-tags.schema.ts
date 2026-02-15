import { Type, type Static } from "typebox";

export const DeleteProductTagsSchema = Type.Object({
  tag_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type DeleteProductTagsProcessInput = Static<
  typeof DeleteProductTagsSchema
>;
