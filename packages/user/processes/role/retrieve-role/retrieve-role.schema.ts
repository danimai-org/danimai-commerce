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
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const RetrieveRoleResponseSchema = Type.Union([
  RoleResponseSchema,
  Type.Undefined(),
]);
export type RetrieveRoleProcessOutput = Static<typeof RetrieveRoleResponseSchema>;
