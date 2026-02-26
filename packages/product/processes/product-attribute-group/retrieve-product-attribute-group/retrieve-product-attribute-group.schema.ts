import { Type, type Static } from "@sinclair/typebox";

export const RetrieveProductAttributeGroupSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductAttributeGroupProcessInput = Static<
  typeof RetrieveProductAttributeGroupSchema
>;

export const ProductAttributeGroupResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const RetrieveProductAttributeGroupResponseSchema = Type.Union([
  Type.Any(),
  Type.Undefined(),
]);
export type RetrieveProductAttributeGroupProcessOutput = Static<
  typeof RetrieveProductAttributeGroupResponseSchema
>;
