import { Type, type Static } from "typebox";

export const UpdateProductAttributeSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  type: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type UpdateProductAttributeProcessInput = Static<
  typeof UpdateProductAttributeSchema
>;
