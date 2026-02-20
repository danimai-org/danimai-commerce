import { Type, type Static } from "typebox";

export const RetrieveCustomerSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveCustomerProcessInput = Static<
  typeof RetrieveCustomerSchema
>;
