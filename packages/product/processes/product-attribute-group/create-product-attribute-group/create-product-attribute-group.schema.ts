import { Type, type Static } from "@sinclair/typebox";
import { ProductAttributeGroupResponseSchema } from "../retrieve-product-attribute-group/retrieve-product-attribute-group.schema";

export const CreateProductAttributeGroupSchema = Type.Object({
  title: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
  attributes: Type.Optional(Type.Array(
    Type.Object({
      attribute_id: Type.String({ format: "uuid" }),
      required: Type.Optional(Type.Boolean()),
    }),
    { uniqueItems: true }
  )),
});

export type CreateProductAttributeGroupProcessInput = Static<
  typeof CreateProductAttributeGroupSchema
>;

export const CreateProductAttributeGroupResponseSchema = Type.Union([
  ProductAttributeGroupResponseSchema,
  Type.Undefined(),
]);
export type CreateProductAttributeGroupProcessOutput = Static<
  typeof CreateProductAttributeGroupResponseSchema
>;
