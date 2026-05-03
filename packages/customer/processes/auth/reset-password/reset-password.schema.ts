import { Type, type Static } from "@sinclair/typebox";

export const CustomerResetPasswordSchema = Type.Object({
  token: Type.String({
    minLength: 1,
    description: "Raw reset token from forgot-password",
  }),
  password: Type.String({
    minLength: 8,
    description: "New password",
    examples: ["NewPassword123!"],
  }),
});

export type CustomerResetPasswordInput = Static<
  typeof CustomerResetPasswordSchema
>;

export const CustomerResetPasswordResponseSchema = Type.Object({
  customer_id: Type.String({ format: "uuid" }),
});

export type CustomerResetPasswordResponse = Static<
  typeof CustomerResetPasswordResponseSchema
>;
