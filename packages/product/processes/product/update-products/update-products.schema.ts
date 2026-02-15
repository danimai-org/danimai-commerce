import { Type, type Static } from "typebox";
import { UpdateProductSchema } from "../update-product/update-product.schema";

export const UpdateProductsSchema = Type.Object({
  products: Type.Array(UpdateProductSchema),
});

export type UpdateProductsProcessInput = Static<
  typeof UpdateProductsSchema
>;
