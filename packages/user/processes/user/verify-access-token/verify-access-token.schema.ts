import { Type, type Static } from "@sinclair/typebox";

export const VerifyAccessTokenSchema = Type.Object({
  access_token: Type.String({
    minLength: 1,
    description: "The JWT access token",
    examples: ["eyJ..."],
  }),
});

export type VerifyAccessTokenProcessInput = Static<typeof VerifyAccessTokenSchema>;

export const VerifyAccessTokenResponseSchema = Type.Any();
export type VerifyAccessTokenProcessOutput = Static<
  typeof VerifyAccessTokenResponseSchema
>;
