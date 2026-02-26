import { Type, type Static } from "@sinclair/typebox";
import { SessionResponseSchema } from "../create-session/create-session.schema";

export const UpdateSessionSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "The session ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  refresh_token: Type.Optional(
    Type.String({
      description: "Hashed and stored as refresh_token_hash",
      examples: ["eyJ..."],
    })
  ),
  expires_at: Type.Optional(
    Type.String({
      description: "ISO timestamp when the session expires",
      examples: ["2025-12-31T23:59:59.000Z"],
    })
  ),
});

export type UpdateSessionProcessInput = Static<typeof UpdateSessionSchema>;

export const UpdateSessionResponseSchema = Type.Union([
  SessionResponseSchema,
  Type.Undefined(),
]);
export type UpdateSessionProcessOutput = Static<
  typeof UpdateSessionResponseSchema
>;
