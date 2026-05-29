import { Type, type Static } from "@sinclair/typebox";

export const CustomerSignupSchema = Type.Object({
  email: Type.String({
    minLength: 1,
    description: "Customer email",
    examples: ["buyer@example.com"],
  }),
  password: Type.String({
    minLength: 8,
    description: "Account password",
    examples: ["Password123!"],
  }),
  first_name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  last_name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type CustomerSignupProcessInput = Static<typeof CustomerSignupSchema>;

export const CustomerSignupResponseSchema = Type.Object({
  message: Type.String({
    description:
      "Confirmation that signup succeeded; verify email using the link sent to the address.",
  }),
});

export type CustomerSignupResponse = Static<
  typeof CustomerSignupResponseSchema
>;
