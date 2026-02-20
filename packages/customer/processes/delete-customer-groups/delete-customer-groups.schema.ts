import { Type, type Static } from "typebox";

export const DeleteCustomerGroupsSchema = Type.Object({
  customer_group_ids: Type.Array(Type.String()),
});

export type DeleteCustomerGroupsProcessInput = Static<typeof DeleteCustomerGroupsSchema>;
