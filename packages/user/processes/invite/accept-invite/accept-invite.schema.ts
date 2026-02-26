import { Type, type Static } from "@sinclair/typebox";
import { MeResponseSchema } from "../../user/retrieve-user/retrieve-user.schema";

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

export const AcceptInviteResponseSchema = Type.Union([
  MeResponseSchema,
  Type.Undefined(),
]);
export type AcceptInviteProcessOutput = Static<
  typeof AcceptInviteResponseSchema
>;
