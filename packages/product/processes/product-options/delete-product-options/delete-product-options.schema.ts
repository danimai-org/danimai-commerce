import { Type, type Static } from "typebox";

export const DeleteProductOptionsSchema = Type.Object({
  option_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type DeleteProductOptionsProcessInput = Static<
  typeof DeleteProductOptionsSchema
>;
