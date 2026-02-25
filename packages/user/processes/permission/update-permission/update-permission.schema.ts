import { Type, type Static } from "@sinclair/typebox";

export const UpdatePermissionSchema = Type.Object({
  id: Type.String({
    description: "The permission ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
  name: Type.Optional(
    Type.String({
      description: "The permission name",
      examples: ["users:read"],
    })
  ),
  description: Type.Optional(
    Type.String({
      description: "The permission description",
      examples: ["Read users"],
    })
  ),
});

export type UpdatePermissionProcessInput = Static<
  typeof UpdatePermissionSchema
>;
