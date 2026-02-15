import { Type, type Static } from "typebox";

export const CreateSessionSchema = Type.Object({
  user_id: Type.String({ format: "uuid" }),
  expires_at: Type.String(), // ISO timestamp
  ip_address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  user_agent: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type CreateSessionProcessInput = Static<typeof CreateSessionSchema>;
