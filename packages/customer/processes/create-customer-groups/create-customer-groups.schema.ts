import { Type, type Static } from "typebox";

export const CreateCustomerGroupSchema = Type.Object({
  name: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]))),
});

export const CreateCustomerGroupsSchema = Type.Object({
  customer_groups: Type.Array(CreateCustomerGroupSchema),
});

export type CreateCustomerGroupProcessInput = Static<typeof CreateCustomerGroupSchema>;
export type CreateCustomerGroupsProcessInput = Static<typeof CreateCustomerGroupsSchema>;
