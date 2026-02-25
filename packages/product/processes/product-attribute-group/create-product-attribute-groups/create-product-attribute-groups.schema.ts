import { Type, type Static } from "typebox";

export const CreateProductAttributeGroupSchema = Type.Object({
  title: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductAttributeGroupProcessInput = Static<
  typeof CreateProductAttributeGroupSchema
>;
