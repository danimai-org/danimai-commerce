import { Type, type Static } from "@sinclair/typebox";

export const LoginSchema = Type.Object({
  email: Type.String({
    minLength: 1,
    description: "The email of the user",
    examples: ["test@example.com"],
  }),
  password: Type.String({
    minLength: 1,
    description: "The password of the user",
    examples: ["Password123!"],
  }),
});

export type LoginProcessInput = Static<typeof LoginSchema>;

export const AuthTokensResponseSchema = Type.Object(
  {
    access_token: Type.String({ description: "JWT access token" }),
    refresh_token: Type.String({ description: "JWT refresh token" }),
    expires_in: Type.Number({ description: "Access token TTL in seconds" }),
  },
  {
    examples: [
      {
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        expires_in: 900,
      },
    ],
  }
);
