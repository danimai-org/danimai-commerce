import { Type, type Static } from "@sinclair/typebox";
import { ProductCategoryResponseSchema } from "../retrieve-product-category/retrieve-product-category.schema";
import { ProductCategoryStatus, ProductCategoryVisibility } from "../../../db/type";

export const CreateProductCategorySchema = Type.Object({
  value: Type.String(),
  parent_id: Type.Optional(Type.String({ format: "uuid", examples: ["123e4567-e89b-12d3-a456-426614174000"] })),
  status: Type.Optional(Type.Enum(ProductCategoryStatus, { examples: [ProductCategoryStatus.ACTIVE] })),
  visibility: Type.Optional(Type.Enum(ProductCategoryVisibility, { examples: [ProductCategoryVisibility.PUBLIC] })),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductCategoryProcessInput = Static<
  typeof CreateProductCategorySchema
>;

export const CreateProductCategoryResponseSchema = Type.Union([
  ProductCategoryResponseSchema,
  Type.Undefined(),
]);
export type CreateProductCategoryProcessOutput = Static<
  typeof CreateProductCategoryResponseSchema
>;
