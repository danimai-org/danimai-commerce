import { Type, type Static } from "typebox";

export const ListCustomerAddressesSchema = Type.Object({
  customer_id: Type.String(),
});

export type ListCustomerAddressesProcessInput = Static<
  typeof ListCustomerAddressesSchema
>;
