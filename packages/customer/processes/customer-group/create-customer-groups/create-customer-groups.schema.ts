import { Type, type Static } from "@sinclair/typebox";
import { CustomerGroupEntitySchema } from "../retrieve-customer-group/retrieve-customer-group.schema";

export const CreateCustomerGroupSchema = Type.Object({
  name: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]))),
});

export const CreateCustomerGroupsSchema = Type.Object({
  customer_groups: Type.Array(CreateCustomerGroupSchema),
});

export type CreateCustomerGroupProcessInput = Static<typeof CreateCustomerGroupSchema>;
export type CreateCustomerGroupsProcessInput = Static<typeof CreateCustomerGroupsSchema>;

export const CreateCustomerGroupsResponseSchema = Type.Array(
  CustomerGroupEntitySchema
);
export type CreateCustomerGroupsProcessOutput = Static<
  typeof CreateCustomerGroupsResponseSchema
>;
