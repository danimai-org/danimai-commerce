import { Type, type Static } from "@sinclair/typebox";

export const DeleteProductAttributeGroupsSchema = Type.Object({
  attribute_group_ids: Type.Array(Type.String()),
});

export type DeleteProductAttributeGroupsProcessInput = Static<
  typeof DeleteProductAttributeGroupsSchema
>;

export const DeleteProductAttributeGroupsResponseSchema = Type.Undefined();
export type DeleteProductAttributeGroupsProcessOutput = void;
