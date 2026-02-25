import { Type, type Static } from "@sinclair/typebox";

export const RetrieveRoleSchema = Type.Object({
  id: Type.String({
    description: "The role ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
});

export type RetrieveRoleProcessInput = Static<typeof RetrieveRoleSchema>;
