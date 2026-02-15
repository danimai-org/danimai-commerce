import { Type, type Static } from "typebox";

export const RetrieveRoleSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveRoleProcessInput = Static<typeof RetrieveRoleSchema>;
