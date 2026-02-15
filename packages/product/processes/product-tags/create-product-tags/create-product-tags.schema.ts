import { Type, type Static } from "typebox";

export const CreateProductTagSchema = Type.Object({
  value: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductTagProcessInput = Static<
  typeof CreateProductTagSchema
>;
