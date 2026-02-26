import { Type, type Static } from "@sinclair/typebox";

export const DeleteProductVariantsSchema = Type.Object({
  variant_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type DeleteProductVariantsProcessInput = Static<
  typeof DeleteProductVariantsSchema
>;

export const DeleteProductVariantsResponseSchema = Type.Undefined();
export type DeleteProductVariantsProcessOutput = void;
