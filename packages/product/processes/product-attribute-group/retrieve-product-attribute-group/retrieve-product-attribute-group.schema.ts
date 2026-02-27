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
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

const RetrieveProductAttributeGroupAttributeSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  type: Type.String(),
});

export const RetrieveProductAttributeGroupResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
  attributes: Type.Array(RetrieveProductAttributeGroupAttributeSchema),
});
export type RetrieveProductAttributeGroupProcessOutput = Static<
  typeof RetrieveProductAttributeGroupResponseSchema
>;
