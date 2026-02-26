import { Type, type Static } from "@sinclair/typebox";
import { ProductTagResponseSchema } from "../retrieve-product-tag/retrieve-product-tag.schema";

export const CreateProductTagSchema = Type.Object({
  value: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductTagProcessInput = Static<
  typeof CreateProductTagSchema
>;

export const CreateProductTagsResponseSchema = Type.Union([
  ProductTagResponseSchema,
  Type.Undefined(),
]);
export type CreateProductTagsProcessOutput = Static<
  typeof CreateProductTagsResponseSchema
>;
