import { Type, type Static } from "@sinclair/typebox";

export const RetrieveProductCategorySchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductCategoryProcessInput = Static<
  typeof RetrieveProductCategorySchema
>;

const RetrieveProductCategoryAttributeSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  type: Type.String(),
  required: Type.Boolean(),
});

export const ProductCategoryResponseSchema = Type.Object({
  id: Type.String(),
  value: Type.String(),
  handle: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  parent_id: Type.Union([Type.String(), Type.Null()]),
  status: Type.Union([
    Type.Literal("active"),
    Type.Literal("inactive"),
  ]),
  visibility: Type.Union([
    Type.Literal("public"),
    Type.Literal("private"),
  ]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveProductCategoryResponseSchema = Type.Object({
  ...ProductCategoryResponseSchema.properties,
  attributes: Type.Array(RetrieveProductCategoryAttributeSchema),
});

export type RetrieveProductCategoryProcessOutput = Static<
  typeof RetrieveProductCategoryResponseSchema
>;
