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

export const SessionResponseSchema = Type.Object({
  id: Type.String(),
  user_id: Type.String(),
  refresh_token_hash: Type.Union([Type.String(), Type.Null()]),
  ip_address: Type.Union([Type.String(), Type.Null()]),
  user_agent: Type.Union([Type.String(), Type.Null()]),
  expires_at: Type.String(),
  logged_out_at: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
});

export const CreateSessionResponseSchema = Type.Union([
  SessionResponseSchema,
  Type.Undefined(),
]);
export type CreateSessionProcessOutput = Static<
  typeof CreateSessionResponseSchema
>;
