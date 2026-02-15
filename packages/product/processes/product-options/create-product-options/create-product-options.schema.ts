import { Type, type Static } from "typebox";

export const CreateProductOptionSchema = Type.Object({
  title: Type.String(),
  product_id: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductOptionProcessInput = Static<
  typeof CreateProductOptionSchema
>;
