import { Type, type Static } from "typebox";

export const UpdateProductTagSchema = Type.Object({
  id: Type.String(),
  value: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type UpdateProductTagProcessInput = Static<
  typeof UpdateProductTagSchema
>;
