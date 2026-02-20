import { Type, type Static } from "typebox";

export const AddCustomerToGroupSchema = Type.Object({
  customer_id: Type.String(),
  customer_group_id: Type.String(),
});

export type AddCustomerToGroupProcessInput = Static<
  typeof AddCustomerToGroupSchema
>;
