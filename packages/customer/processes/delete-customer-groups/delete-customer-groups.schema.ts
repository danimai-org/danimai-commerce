import { Type, type Static } from "@sinclair/typebox";

export const DeleteCustomerGroupsSchema = Type.Object({
  customer_group_ids: Type.Array(Type.String()),
});

export type DeleteCustomerGroupsProcessInput = Static<typeof DeleteCustomerGroupsSchema>;

export const DeleteCustomerGroupsResponseSchema = Type.Undefined();
export type DeleteCustomerGroupsProcessOutput = void;
