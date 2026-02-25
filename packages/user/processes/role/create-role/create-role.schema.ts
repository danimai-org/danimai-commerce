import { Type, type Static } from "@sinclair/typebox";

export const CreateRoleSchema = Type.Object({
  name: Type.String({
    description: "The role name",
    examples: ["admin"],
  }),
  description: Type.Optional(
    Type.String({
      description: "The role description",
      examples: ["Administrator"],
    })
  ),
});

export type CreateRoleProcessInput = Static<typeof CreateRoleSchema>;
