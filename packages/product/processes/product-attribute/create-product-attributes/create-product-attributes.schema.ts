import { Type, type Static } from "@sinclair/typebox";
import { ProductAttributeResponseSchema } from "../retrieve-product-attribute/retrieve-product-attribute.schema";

export const CreateProductAttributeSchema = Type.Object({
  title: Type.String(),
  type: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductAttributeProcessInput = Static<
  typeof CreateProductAttributeSchema
>;

export const CreateProductAttributesResponseSchema = Type.Union([
  ProductAttributeResponseSchema,
  Type.Undefined(),
]);
export type CreateProductAttributesProcessOutput = Static<
  typeof CreateProductAttributesResponseSchema
>;
