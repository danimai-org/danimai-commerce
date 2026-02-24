import { Type, type Static } from "typebox";

const UpdateProductAttributeGroupRelationSchema = Type.Object({
  attribute_group_id: Type.String(),
  required: Type.Optional(Type.Boolean()),
  rank: Type.Optional(Type.Number()),
});

export const UpdateProductAttributeEntrySchema = Type.Object({
  attribute_group_id: Type.String(),
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
  attribute_group_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Array(Type.String()), Type.Array(Type.Number())]))),
  attribute_groups: Type.Optional(Type.Array(UpdateProductAttributeGroupRelationSchema)),
  attributes: Type.Optional(Type.Array(UpdateProductAttributeEntrySchema)),
  tag_ids: Type.Optional(Type.Array(Type.String())),
  collection_ids: Type.Optional(Type.Array(Type.String())),
});

export type UpdateProductProcessInput = Static<
  typeof UpdateProductSchema
>;
