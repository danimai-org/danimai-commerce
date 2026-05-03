import { Type, type Static } from "@sinclair/typebox";
import { CustomerSessionResponseSchema } from "../create-session/create-session.schema";

export const ExpireCustomerSessionSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "The session ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
});

export type ExpireCustomerSessionProcessInput = Static<
  typeof ExpireCustomerSessionSchema
>;

export const ExpireCustomerSessionResponseSchema = Type.Union([
  CustomerSessionResponseSchema,
  Type.Undefined(),
]);
export type ExpireCustomerSessionProcessOutput = Static<
  typeof ExpireCustomerSessionResponseSchema
>;
