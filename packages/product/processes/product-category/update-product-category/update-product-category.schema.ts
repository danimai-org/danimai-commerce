import { Type, type Static } from "@sinclair/typebox";
import { ProductCategoryResponseSchema } from "../retrieve-product-category/retrieve-product-category.schema";
import { ProductCategoryStatus, ProductCategoryVisibility } from "../../../db/type";

export const UpdateProductCategoryBodySchema = Type.Object({
  value: Type.Optional(Type.String({ examples: ["Electronics"] })),
  parent_id: Type.Optional(Type.String({ format: "uuid", examples: ["123e4567-e89b-12d3-a456-426614174000"] })),
  status: Type.Optional(Type.Enum(ProductCategoryStatus, { examples: [ProductCategoryStatus.ACTIVE] })),
  visibility: Type.Optional(Type.Enum(ProductCategoryVisibility, { examples: [ProductCategoryVisibility.PUBLIC] })),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export const UpdateProductCategorySchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  ...UpdateProductCategoryBodySchema.properties,
});

export type UpdateProductCategoryProcessInput = Static<
  typeof UpdateProductCategorySchema
>;

export const UpdateProductCategoryResponseSchema = Type.Union([
  ProductCategoryResponseSchema,
  Type.Undefined(),
]);
export type UpdateProductCategoryProcessOutput = Static<
  typeof UpdateProductCategoryResponseSchema
>;
