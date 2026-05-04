import { Type, type Static } from "@sinclair/typebox";

export const RemoveCustomerFromGroupSchema = Type.Object({
  customer_id: Type.String(),
  customer_group_id: Type.Optional(Type.String()),
});

export type RemoveCustomerFromGroupProcessInput = Static<
  typeof RemoveCustomerFromGroupSchema
>;

export const RemoveCustomerFromGroupResponseSchema = Type.Undefined();
export type RemoveCustomerFromGroupProcessOutput = void;
