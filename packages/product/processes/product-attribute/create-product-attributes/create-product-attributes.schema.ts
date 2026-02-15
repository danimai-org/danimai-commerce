import { Type, type Static } from "typebox";

export const CreateProductAttributeSchema = Type.Object({
  title: Type.String(),
  type: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductAttributeProcessInput = Static<
  typeof CreateProductAttributeSchema
>;
