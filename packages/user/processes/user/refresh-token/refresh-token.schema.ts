import { Type, type Static } from "@sinclair/typebox";
import { AuthTokensResponseSchema } from "../login/login.schema";

export const RefreshTokenSchema = Type.Object({
  refresh_token: Type.String({
    minLength: 1,
    description: "The refresh token",
    examples: ["eyJ..."],
  }),
});

export type RefreshTokenProcessInput = Static<typeof RefreshTokenSchema>;

export const RefreshTokenResponseSchema = AuthTokensResponseSchema;
export type RefreshTokenProcessOutput = Static<typeof RefreshTokenResponseSchema>;
