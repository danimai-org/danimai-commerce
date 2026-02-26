import { Type, type Static } from "@sinclair/typebox";

export const RetrieveProductAttributeSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductAttributeProcessInput = Static<
  typeof RetrieveProductAttributeSchema
>;

export const ProductAttributeResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  type: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const RetrieveProductAttributeResponseSchema = Type.Union([
  ProductAttributeResponseSchema,
  Type.Undefined(),
]);
export type RetrieveProductAttributeProcessOutput = Static<
  typeof RetrieveProductAttributeResponseSchema
>;
