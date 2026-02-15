import { Type, type Static } from "typebox";

export const UpdatePermissionSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
});

export type UpdatePermissionProcessInput = Static<typeof UpdatePermissionSchema>;
