import { Type, type Static } from "@sinclair/typebox";

export const DeleteProductOptionsSchema = Type.Object({
  option_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type DeleteProductOptionsProcessInput = Static<
  typeof DeleteProductOptionsSchema
>;

export const DeleteProductOptionsResponseSchema = Type.Undefined();
export type DeleteProductOptionsProcessOutput = void;
