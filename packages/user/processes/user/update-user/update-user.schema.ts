import { Type, type Static } from "@sinclair/typebox";

export const UpdateUserSchema = Type.Object({
  id: Type.String({
    description: "The user ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  first_name: Type.Optional(
    Type.Union([
      Type.String({
        description: "The user's first name",
        examples: ["John"],
      }),
      Type.Null(),
    ])
  ),
  last_name: Type.Optional(
    Type.Union([
      Type.String({
        description: "The user's last name",
        examples: ["Doe"],
      }),
      Type.Null(),
    ])
  ),
  role_id: Type.Optional(
    Type.Union([
      Type.String({
        format: "uuid",
        description: "The role ID",
        examples: ["550e8400-e29b-41d4-a716-446655440000"],
      }),
      Type.Null(),
    ])
  ),
});

export type UpdateUserProcessInput = Static<typeof UpdateUserSchema>;
