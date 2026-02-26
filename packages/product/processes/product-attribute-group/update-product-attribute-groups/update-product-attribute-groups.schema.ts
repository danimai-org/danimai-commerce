import { Type, type Static } from "@sinclair/typebox";
import { ProductAttributeGroupResponseSchema } from "../retrieve-product-attribute-group/retrieve-product-attribute-group.schema";

export const UpdateProductAttributeGroupSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
  attribute_ids: Type.Optional(Type.Array(Type.String())),
});

export type UpdateProductAttributeGroupProcessInput = Static<
  typeof UpdateProductAttributeGroupSchema
>;

export const UpdateProductAttributeGroupsResponseSchema = Type.Union([
  ProductAttributeGroupResponseSchema,
  Type.Undefined(),
]);
export type UpdateProductAttributeGroupsProcessOutput = Static<
  typeof UpdateProductAttributeGroupsResponseSchema
>;
