import { Type, type Static } from "@sinclair/typebox";
import { ProductAttributeGroupResponseSchema } from "../retrieve-product-attribute-group/retrieve-product-attribute-group.schema";

export const CreateProductAttributeGroupSchema = Type.Object({
  title: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductAttributeGroupProcessInput = Static<
  typeof CreateProductAttributeGroupSchema
>;

export const CreateProductAttributeGroupsResponseSchema = Type.Union([
  ProductAttributeGroupResponseSchema,
  Type.Undefined(),
]);
export type CreateProductAttributeGroupsProcessOutput = Static<
  typeof CreateProductAttributeGroupsResponseSchema
>;
