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
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const RetrieveProductResponseSchema = Type.Union([
  ProductResponseSchema,
  Type.Null(),
]);
export type RetrieveProductProcessOutput = Static<
  typeof RetrieveProductResponseSchema
>;
