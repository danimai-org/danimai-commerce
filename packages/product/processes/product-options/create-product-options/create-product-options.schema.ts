import { Type, type Static } from "@sinclair/typebox";
import { ProductOptionResponseSchema } from "../retrieve-product-option/retrieve-product-option.schema";

export const CreateProductOptionSchema = Type.Object({
  title: Type.String(),
  product_id: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductOptionProcessInput = Static<
  typeof CreateProductOptionSchema
>;

export const CreateProductOptionsResponseSchema = Type.Union([
  ProductOptionResponseSchema,
  Type.Undefined(),
]);
export type CreateProductOptionsProcessOutput = Static<
  typeof CreateProductOptionsResponseSchema
>;
