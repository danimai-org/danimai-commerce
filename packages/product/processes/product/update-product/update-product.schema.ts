import { Type, type Static } from "@sinclair/typebox";

export const UpdateProductAttributeEntrySchema = Type.Object({
  attribute_id: Type.String(),
  value: Type.String(),
});

export const UpdateProductSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  handle: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  is_giftcard: Type.Optional(Type.Boolean()),
  discountable: Type.Optional(Type.Boolean()),
  status: Type.Optional(Type.Union([Type.Literal("draft"), Type.Literal("proposed"), Type.Literal("published"), Type.Literal("rejected")])),
  thumbnail: Type.Optional(Type.String()),
  thumbnail_media_id: Type.Optional(Type.Union([Type.String({ format: "uuid" }), Type.Null()])),
  media_ids: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
  sales_channel_ids: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
  external_id: Type.Optional(Type.String()),
  category_id: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Array(Type.String()), Type.Array(Type.Number())]))),
  attributes: Type.Optional(Type.Array(UpdateProductAttributeEntrySchema)),
  tag_ids: Type.Optional(Type.Array(Type.String())),
  collection_ids: Type.Optional(Type.Array(Type.String())),
});

export type UpdateProductProcessInput = Static<
  typeof UpdateProductSchema
>;

export const UpdateProductResponseSchema = Type.Union([
  Type.String(),
  Type.Undefined(),
]);
export type UpdateProductProcessOutput = Static<
  typeof UpdateProductResponseSchema
>;
