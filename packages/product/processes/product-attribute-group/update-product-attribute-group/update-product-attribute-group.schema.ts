import { Type, type Static } from "@sinclair/typebox";
import { ProductAttributeGroupResponseSchema } from "../retrieve-product-attribute-group/retrieve-product-attribute-group.schema";

export const UpdateProductAttributeGroupSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
  attributes: Type.Optional(Type.Array(
    Type.Object({
      attribute_id: Type.String({ format: "uuid" }),
      required: Type.Optional(Type.Boolean()),
    }), { uniqueItems: true }
  )),
});

export type UpdateProductAttributeGroupProcessInput = Static<
  typeof UpdateProductAttributeGroupSchema
>;

export const UpdateProductAttributeGroupResponseSchema = Type.Union([
  ProductAttributeGroupResponseSchema,
  Type.Undefined(),
]);
export type UpdateProductAttributeGroupProcessOutput = Static<
  typeof UpdateProductAttributeGroupResponseSchema
>;
