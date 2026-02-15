import { Type, type Static } from "typebox";

export const UpdateSessionSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  refresh_token: Type.Optional(Type.String()), // hashed and stored as refresh_token_hash
  expires_at: Type.Optional(Type.String()), // ISO timestamp
});

export type UpdateSessionProcessInput = Static<typeof UpdateSessionSchema>;
