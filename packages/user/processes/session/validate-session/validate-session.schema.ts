import { Type, type Static } from "@sinclair/typebox";
import { SessionResponseSchema } from "../create-session/create-session.schema";

export const ValidateSessionSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "The session ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  user_id: Type.String({
    format: "uuid",
    description: "The user ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  refresh_token: Type.Optional(
    Type.String({
      description: "If provided, must match session.refresh_token_hash",
      examples: ["eyJ..."],
    })
  ),
});

export type ValidateSessionProcessInput = Static<typeof ValidateSessionSchema>;

export const ValidateSessionResponseSchema = Type.Union([
  SessionResponseSchema,
  Type.Undefined(),
]);
export type ValidateSessionProcessOutput = Static<
  typeof ValidateSessionResponseSchema
>;
