import { Type, type Static } from "typebox";

export const DeleteRolesSchema = Type.Object({
  role_ids: Type.Array(Type.String()),
});

export type DeleteRolesProcessInput = Static<typeof DeleteRolesSchema>;
