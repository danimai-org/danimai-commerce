import { Type, type StaticDecode } from "@sinclair/typebox";
import { ProductTagResponseSchema } from "../retrieve-product-tag/retrieve-product-tag.schema";

// Input schema
export const CreateProductTagSchema = Type.Object({
  value: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductTagProcessInput = StaticDecode<
  typeof CreateProductTagSchema
  >;

// Output schema
export const CreateProductTagResponseSchema = ProductTagResponseSchema;

export type CreateProductTagsProcessOutput = StaticDecode<
  typeof ProductTagResponseSchema
>;
