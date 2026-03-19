import { Type, type Static } from "@sinclair/typebox";

export const DeleteProductVariantsSchema = Type.Object({
  ids: Type.Array(Type.String({ format: "uuid" })),
});

export type DeleteProductVariantsProcessInput = Static<
  typeof DeleteProductVariantsSchema
>;

export const DeleteProductVariantsResponseSchema = Type.Undefined();
export type DeleteProductVariantsProcessOutput = void;
