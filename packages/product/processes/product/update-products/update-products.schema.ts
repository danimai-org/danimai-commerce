import { Type, type Static } from "@sinclair/typebox";
import { UpdateProductSchema } from "../update-product/update-product.schema";
import { ProductResponseSchema } from "../retrieve-product/retrieve-product.schema";

export const UpdateProductsSchema = Type.Object({
  products: Type.Array(UpdateProductSchema),
});

export type UpdateProductsProcessInput = Static<
  typeof UpdateProductsSchema
>;

export const UpdateProductsResponseSchema = Type.Array(ProductResponseSchema);
export type UpdateProductsProcessOutput = Static<
  typeof UpdateProductsResponseSchema
>;
