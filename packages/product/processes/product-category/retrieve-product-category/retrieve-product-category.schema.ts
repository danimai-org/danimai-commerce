import { Type, type Static } from "@sinclair/typebox";

export const RetrieveProductCategorySchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductCategoryProcessInput = Static<
  typeof RetrieveProductCategorySchema
>;

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

export const RetrieveProductCategoryResponseSchema = Type.Union([
  ProductCategoryResponseSchema,
  Type.Undefined(),
]);
export type RetrieveProductCategoryProcessOutput = Static<
  typeof RetrieveProductCategoryResponseSchema
>;
