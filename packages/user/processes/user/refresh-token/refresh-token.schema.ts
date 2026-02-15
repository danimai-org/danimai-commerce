import { Type, type Static } from "typebox";

export const RefreshTokenSchema = Type.Object({
  refresh_token: Type.String({ minLength: 1 }),
});

export type RefreshTokenProcessInput = Static<typeof RefreshTokenSchema>;
