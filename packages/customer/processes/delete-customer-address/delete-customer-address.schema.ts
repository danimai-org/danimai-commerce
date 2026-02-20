import { Type, type Static } from "typebox";

export const DeleteCustomerAddressSchema = Type.Object({
  id: Type.String(),
  customer_id: Type.String(),
});

export type DeleteCustomerAddressProcessInput = Static<
  typeof DeleteCustomerAddressSchema
>;
