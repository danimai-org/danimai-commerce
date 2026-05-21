import { Type, type Static } from "@sinclair/typebox";

export const DeleteCustomersSchema = Type.Object({
  customer_ids: Type.Array(Type.String()),
});

export type DeleteCustomersProcessInput = Static<typeof DeleteCustomersSchema>;

export const DeleteCustomersResponseSchema = Type.Undefined();
export type DeleteCustomersProcessOutput = void;
