import { Type, type Static } from "@sinclair/typebox";

export const RetrieveProductTagSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductTagProcessInput = Static<
  typeof RetrieveProductTagSchema
>;

export const ProductTagResponseSchema = Type.Object({
  id: Type.String(),
  value: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const RetrieveProductTagResponseSchema = Type.Union([
  ProductTagResponseSchema,
  Type.Undefined(),
]);
export type RetrieveProductTagProcessOutput = Static<
  typeof RetrieveProductTagResponseSchema
>;
