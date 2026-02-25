import { Type, type Static } from "@sinclair/typebox";

export const CreateInviteSchema = Type.Object({
  email: Type.String({
    format: "email",
    description: "The email address to invite",
    examples: ["user@example.com"],
  }),
  role_id: Type.Optional(
    Type.String({
      format: "uuid",
      description: "The role ID to assign",
      examples: ["550e8400-e29b-41d4-a716-446655440000"],
    })
  ),
});

export type CreateInviteProcessInput = Static<typeof CreateInviteSchema>;
