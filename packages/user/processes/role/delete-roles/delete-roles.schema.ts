import { Type, type Static } from "@sinclair/typebox";

export const DeleteRolesSchema = Type.Object({
  role_ids: Type.Array(Type.String(), {
    description: "Array of role IDs to delete",
    examples: [["550e8400-e29b-41d4-a716-446655440000"]],
  }),
});

export type DeleteRolesProcessInput = Static<typeof DeleteRolesSchema>;

export const DeleteRolesResponseSchema = Type.Undefined();
export type DeleteRolesProcessOutput = void;
