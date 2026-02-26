import { Type, type Static } from "@sinclair/typebox";
import { InviteResponseSchema } from "../create-invite/create-invite.schema";

export const ResendInviteSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "The invite ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
});

export type ResendInviteProcessInput = Static<typeof ResendInviteSchema>;

export const ResendInviteResponseSchema = Type.Union([
  InviteResponseSchema,
  Type.Undefined(),
]);
export type ResendInviteProcessOutput = Static<
  typeof ResendInviteResponseSchema
>;
