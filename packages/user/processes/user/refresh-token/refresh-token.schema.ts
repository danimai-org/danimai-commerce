import { Type, type Static } from "@sinclair/typebox";

export const RefreshTokenSchema = Type.Object({
  refresh_token: Type.String({
    minLength: 1,
    description: "The refresh token",
    examples: ["eyJ..."],
  }),
});

export type RefreshTokenProcessInput = Static<typeof RefreshTokenSchema>;
