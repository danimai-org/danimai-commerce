import { Type, type Static } from "typebox";

export const RetrieveCustomerGroupSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveCustomerGroupProcessInput = Static<
  typeof RetrieveCustomerGroupSchema
>;
