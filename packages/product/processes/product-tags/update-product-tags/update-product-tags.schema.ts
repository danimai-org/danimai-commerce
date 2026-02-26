import { Type, type Static } from "@sinclair/typebox";
import { ProductTagResponseSchema } from "../retrieve-product-tag/retrieve-product-tag.schema";

export const UpdateProductTagSchema = Type.Object({
  id: Type.String(),
  value: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type UpdateProductTagProcessInput = Static<
  typeof UpdateProductTagSchema
>;

export const UpdateProductTagsResponseSchema = Type.Union([
  ProductTagResponseSchema,
  Type.Undefined(),
]);
export type UpdateProductTagsProcessOutput = Static<
  typeof UpdateProductTagsResponseSchema
>;
