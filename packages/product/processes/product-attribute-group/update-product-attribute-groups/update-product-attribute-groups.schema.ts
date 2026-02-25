import { Type, type Static } from "typebox";

export const UpdateProductAttributeGroupSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
  attribute_ids: Type.Optional(Type.Array(Type.String())),
});

export type UpdateProductAttributeGroupProcessInput = Static<
  typeof UpdateProductAttributeGroupSchema
>;
