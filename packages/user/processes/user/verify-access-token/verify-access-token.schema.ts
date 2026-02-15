import { Type, type Static } from "typebox";

export const VerifyAccessTokenSchema = Type.Object({
  access_token: Type.String({ minLength: 1 }),
});

export type VerifyAccessTokenProcessInput = Static<typeof VerifyAccessTokenSchema>;
