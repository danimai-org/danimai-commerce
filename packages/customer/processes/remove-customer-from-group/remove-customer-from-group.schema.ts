import { Type, type Static } from "typebox";

export const RemoveCustomerFromGroupSchema = Type.Object({
  customer_id: Type.String(),
  customer_group_id: Type.Optional(Type.String()),
});

export type RemoveCustomerFromGroupProcessInput = Static<
  typeof RemoveCustomerFromGroupSchema
>;
