import { Type, type Static } from "@sinclair/typebox";

export const RetrieveProductSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductProcessInput = Static<
  typeof RetrieveProductSchema
>;

export const ProductResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  handle: Type.String(),
  subtitle: Type.Union([Type.String(), Type.Null()]),
  description: Type.Union([Type.String(), Type.Null()]),
  is_giftcard: Type.Boolean(),
  status: Type.Union([
    Type.Literal("draft"),
    Type.Literal("proposed"),
    Type.Literal("published"),
    Type.Literal("rejected"),
  ]),
  thumbnail: Type.Union([Type.String(), Type.Null()]),
  discountable: Type.Boolean(),
  external_id: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  category_id: Type.Union([Type.String(), Type.Null()]),
  attribute_group_id: Type.Union([Type.String(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

const CollectionRefSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  handle: Type.String(),
});

const TagRefSchema = Type.Object({
  id: Type.String(),
  value: Type.String(),
});

const AttributeRefSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  type: Type.String(),
  value: Type.String(),
});

export const RetrieveProductResponseSchema = Type.Union([
  Type.Intersect([
    ProductResponseSchema,
    Type.Object({
      collection: Type.Union([CollectionRefSchema, Type.Null()]),
      collections: Type.Array(CollectionRefSchema),
      collection_ids: Type.Array(Type.String()),
      attributes: Type.Array(AttributeRefSchema),
      tag_ids: Type.Array(Type.String()),
      tags: Type.Array(TagRefSchema),
    }),
  ]),
  Type.Null(),
]);
export type RetrieveProductProcessOutput = Static<
  typeof RetrieveProductResponseSchema
>;
