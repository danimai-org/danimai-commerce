import { Type, type Static } from "@sinclair/typebox";

export const RetrieveRoleSchema = Type.Object({
  id: Type.String({
    description: "The role ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
});

export type RetrieveRoleProcessInput = Static<typeof RetrieveRoleSchema>;

export const RoleResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveRoleResponseSchema = Type.Union([
  RoleResponseSchema,
  Type.Undefined(),
]);
export type RetrieveRoleProcessOutput = Static<typeof RetrieveRoleResponseSchema>;
