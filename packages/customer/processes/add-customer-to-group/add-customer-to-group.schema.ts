import { Type, type Static } from "@sinclair/typebox";

export const AddCustomerToGroupSchema = Type.Object({
  customer_id: Type.String(),
  customer_group_id: Type.String(),
});

export type AddCustomerToGroupProcessInput = Static<
  typeof AddCustomerToGroupSchema
>;

export const CustomerGroupCustomerResponseSchema = Type.Object({
  customer_id: Type.String(),
  customer_group_id: Type.String(),
  created_at: Type.String(),
});

export const AddCustomerToGroupResponseSchema = Type.Union([
  CustomerGroupCustomerResponseSchema,
  Type.Undefined(),
]);
export type AddCustomerToGroupProcessOutput = Static<
  typeof AddCustomerToGroupResponseSchema
>;
