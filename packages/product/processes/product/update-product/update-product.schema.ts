import { Type, type Static } from "typebox";

export const UpdateProductAttributeEntrySchema = Type.Object({
  attribute_id: Type.String(),
  value: Type.String(),
});

export const UpdateProductSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  handle: Type.Optional(Type.String()),
  subtitle: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  is_giftcard: Type.Optional(Type.Boolean()),
  discountable: Type.Optional(Type.Boolean()),
  status: Type.Optional(Type.Union([Type.Literal("draft"), Type.Literal("proposed"), Type.Literal("published"), Type.Literal("rejected")])),
  thumbnail: Type.Optional(Type.String()),
  external_id: Type.Optional(Type.String()),
  category_id: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
  attributes: Type.Optional(Type.Array(UpdateProductAttributeEntrySchema)),
  tag_ids: Type.Optional(Type.Array(Type.String())),
  collection_ids: Type.Optional(Type.Array(Type.String())),
});

export type UpdateProductProcessInput = Static<
  typeof UpdateProductSchema
>;
