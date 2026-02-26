import { Type, type Static } from "@sinclair/typebox";

export const DeleteProductTagsSchema = Type.Object({
  tag_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type DeleteProductTagsProcessInput = Static<
  typeof DeleteProductTagsSchema
>;

export const DeleteProductTagsResponseSchema = Type.Undefined();
export type DeleteProductTagsProcessOutput = void;
