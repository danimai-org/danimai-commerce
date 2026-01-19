import { Type, type Static } from "@sinclair/typebox";

export const createProductInputSchema = Type.Object({
  title: Type.String(),
  subtitle: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  is_giftcard: Type.Optional(Type.Boolean()),
  discountable: Type.Optional(Type.Boolean()),
  thumbnail: Type.Optional(Type.String()),
  handle: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  external_id: Type.Optional(Type.String()),
  type_id: Type.Optional(Type.String()),
  collection_id: Type.Optional(Type.String()),
  tag_ids: Type.Optional(Type.Array(Type.String())),
  category_ids: Type.Optional(Type.Array(Type.String())),
  options: Type.Optional(Type.Array(Type.String())),
  variants: Type.Optional(Type.Array(Type.String())),
  width: Type.Optional(Type.Number()),
  height: Type.Optional(Type.Number()),
  length: Type.Optional(Type.Number()),
  weight: Type.Optional(Type.Number()),
  origin_country: Type.Optional(Type.String()),
  hs_code: Type.Optional(Type.String()),
  material: Type.Optional(Type.String()),
  mid_code: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.String()),
  images: Type.Optional(Type.Array(Type.String())),
});

export type CreateProductInput = Static<typeof createProductInputSchema>;
