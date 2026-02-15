import { Type, type Static } from "typebox";

export const UpdateProductOptionSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  product_id: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type UpdateProductOptionProcessInput = Static<
  typeof UpdateProductOptionSchema
>;
