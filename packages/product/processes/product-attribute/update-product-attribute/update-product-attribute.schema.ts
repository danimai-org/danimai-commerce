import { Type, type Static } from "@sinclair/typebox";
import { ProductAttributeResponseSchema } from "../retrieve-product-attribute/retrieve-product-attribute.schema";

export const UpdateProductAttributeSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  type: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type UpdateProductAttributeProcessInput = Static<
  typeof UpdateProductAttributeSchema
>;

export const UpdateProductAttributeResponseSchema = Type.Union([
  ProductAttributeResponseSchema,
  Type.Undefined(),
]);
export type UpdateProductAttributeProcessOutput = Static<
  typeof UpdateProductAttributeResponseSchema
>;
