import { Type, type Static } from "typebox";

export const ValidateSessionSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  user_id: Type.String({ format: "uuid" }),
  refresh_token: Type.Optional(Type.String()), // if provided, must match session.refresh_token_hash
});

export type ValidateSessionProcessInput = Static<typeof ValidateSessionSchema>;
