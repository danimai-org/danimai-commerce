import { Type, type Static } from "@sinclair/typebox";

export const CustomerLoginSchema = Type.Object({
  email: Type.String({
    minLength: 1,
    description: "Customer email",
    examples: ["buyer@example.com"],
  }),
  password: Type.String({
    minLength: 1,
    description: "Account password",
    examples: ["Password123!"],
  }),
});

export type CustomerLoginProcessInput = Static<typeof CustomerLoginSchema>;

export const CustomerAuthTokensResponseSchema = Type.Object({
  access_token: Type.String({ description: "JWT access token" }),
  refresh_token: Type.String({ description: "JWT refresh token" }),
  expires_in: Type.Number({ description: "Access token TTL in seconds" }),
});

export interface CustomerLoginResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
