import { Type, type Static } from "@sinclair/typebox";

export const CustomerForgotPasswordSchema = Type.Object({
  email: Type.String({
    minLength: 1,
    description: "Account email",
    examples: ["buyer@example.com"],
  }),
});

export type CustomerForgotPasswordInput = Static<
  typeof CustomerForgotPasswordSchema
>;

/** reset_token is null when no account exists (avoid email enumeration in HTTP layer). */
export const CustomerForgotPasswordResponseSchema = Type.Object({
  reset_token: Type.Union([Type.String(), Type.Null()]),
});

export type CustomerForgotPasswordResponse = Static<
  typeof CustomerForgotPasswordResponseSchema
>;
