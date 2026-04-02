import { Type, type Static } from "@sinclair/typebox";

export const DEFAULT_SESSION_TTL_DAYS = 90;

export const CreateSessionSchema = Type.Object({
  /** Omit to use default TTL (see DEFAULT_SESSION_TTL_DAYS). */
  expires_at: Type.Optional(
    Type.String({
      description: "ISO timestamp when the session expires",
      examples: ["2025-12-31T23:59:59.000Z"],
    })
  ),
  /** If set, must reference an existing session with expires_at in the past; stored as parent_id. */
  expired_session_id: Type.Optional(
    Type.String({
      format: "uuid",
      description: "Expired session to link as parent (continuity / cart handoff)",
    })
  ),
  ip_address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  user_agent: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type CreateSessionProcessInput = Static<typeof CreateSessionSchema>;

export const SessionResponseSchema = Type.Object({
  id: Type.String(),
  user_id: Type.Union([Type.String(), Type.Null()]),
  parent_id: Type.Union([Type.String(), Type.Null()]),
  refresh_token_hash: Type.Union([Type.String(), Type.Null()]),
  ip_address: Type.Union([Type.String(), Type.Null()]),
  user_agent: Type.Union([Type.String(), Type.Null()]),
  expires_at: Type.String(),
  logged_out_at: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
});

/** Returned by create-session; use `id` as `session_id` when creating a cart. */
export const CreateSessionResultSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "Session id; pass as session_id to create cart",
  }),
});

export const CreateSessionResponseSchema = Type.Union([
  CreateSessionResultSchema,
  Type.Undefined(),
]);
export type CreateSessionProcessOutput = Static<
  typeof CreateSessionResponseSchema
>;
