import { Type, type Static } from "@sinclair/typebox";
import { CustomerSessionResponseSchema } from "../create-session/create-session.schema";

export const ValidateCustomerSessionSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "The session ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  customer_id: Type.String({
    format: "uuid",
    description: "The customer ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  refresh_token: Type.Optional(
    Type.String({
      description: "If provided, must match session.refresh_token_hash",
      examples: ["eyJ..."],
    })
  ),
});

export type ValidateCustomerSessionProcessInput = Static<
  typeof ValidateCustomerSessionSchema
>;

export const ValidateCustomerSessionResponseSchema = Type.Union([
  CustomerSessionResponseSchema,
  Type.Undefined(),
]);
export type ValidateCustomerSessionProcessOutput = Static<
  typeof ValidateCustomerSessionResponseSchema
>;
