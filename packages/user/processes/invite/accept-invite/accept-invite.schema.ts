import { Type, type Static } from "@sinclair/typebox";

export const AcceptInviteSchema = Type.Object({
  token: Type.String({
    minLength: 1,
    description: "The invite token",
    examples: ["eyJ..."],
  }),
  password: Type.String({
    minLength: 8,
    description: "The password to set for the account",
    examples: ["Password123!"],
  }),
});

export type AcceptInviteProcessInput = Static<typeof AcceptInviteSchema>;
