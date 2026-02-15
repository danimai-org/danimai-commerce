import { Type, type Static } from "typebox";

export const CreateRoleSchema = Type.Object({
  name: Type.String(),
  description: Type.Optional(Type.String()),
});

export type CreateRoleProcessInput = Static<typeof CreateRoleSchema>;
