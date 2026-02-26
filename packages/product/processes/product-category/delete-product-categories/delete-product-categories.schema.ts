import { Type, type Static } from "@sinclair/typebox";

export const DeleteProductCategoriesSchema = Type.Object({
  category_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type DeleteProductCategoriesProcessInput = Static<
  typeof DeleteProductCategoriesSchema
>;

export const DeleteProductCategoriesResponseSchema = Type.Undefined();
export type DeleteProductCategoriesProcessOutput = void;
