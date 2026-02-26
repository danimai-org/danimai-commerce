import { Type, type Static } from "@sinclair/typebox";
import { RoleResponseSchema } from "../retrieve-role/retrieve-role.schema";

export const UpdateRoleSchema = Type.Object({
  id: Type.String({
    description: "The role ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  name: Type.Optional(
    Type.String({
      description: "The role name",
      examples: ["admin"],
    })
  ),
  description: Type.Optional(
    Type.String({
      description: "The role description",
      examples: ["Administrator"],
    })
  ),
});

export type UpdateRoleProcessInput = Static<typeof UpdateRoleSchema>;

export const UpdateRoleResponseSchema = Type.Union([
  RoleResponseSchema,
  Type.Undefined(),
]);
export type UpdateRoleProcessOutput = Static<typeof UpdateRoleResponseSchema>;
