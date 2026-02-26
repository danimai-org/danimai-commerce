import { Type, type Static } from "@sinclair/typebox";

export const RetrieveProductOptionSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductOptionProcessInput = Static<
  typeof RetrieveProductOptionSchema
>;

export const ProductOptionResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const RetrieveProductOptionResponseSchema = Type.Union([
  ProductOptionResponseSchema,
  Type.Undefined(),
]);
export type RetrieveProductOptionProcessOutput = Static<
  typeof RetrieveProductOptionResponseSchema
>;
