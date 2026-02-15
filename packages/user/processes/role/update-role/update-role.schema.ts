import { Type, type Static } from "typebox";

export const UpdateRoleSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
});

export type UpdateRoleProcessInput = Static<typeof UpdateRoleSchema>;
