import { Type, type Static } from "typebox";

export const DeleteProductAttributesSchema = Type.Object({
  attribute_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type DeleteProductAttributesProcessInput = Static<
  typeof DeleteProductAttributesSchema
>;
