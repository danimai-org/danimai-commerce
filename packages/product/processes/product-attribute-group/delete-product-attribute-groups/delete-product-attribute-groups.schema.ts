import { Type, type Static } from "typebox";

export const DeleteProductAttributeGroupsSchema = Type.Object({
  attribute_group_ids: Type.Array(Type.String()),
});

export type DeleteProductAttributeGroupsProcessInput = Static<
  typeof DeleteProductAttributeGroupsSchema
>;
