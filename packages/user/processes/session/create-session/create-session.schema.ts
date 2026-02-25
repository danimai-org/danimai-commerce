import { Type, type Static } from "@sinclair/typebox";

export const CreateSessionSchema = Type.Object({
  user_id: Type.String({
    format: "uuid",
    description: "The user ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  expires_at: Type.String({
    description: "ISO timestamp when the session expires",
    examples: ["2025-12-31T23:59:59.000Z"],
  }),
  ip_address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  user_agent: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type CreateSessionProcessInput = Static<typeof CreateSessionSchema>;
