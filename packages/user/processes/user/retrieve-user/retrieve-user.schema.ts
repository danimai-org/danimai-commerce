import { Type, type Static } from "typebox";

export const RetrieveUserSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
});

export type RetrieveUserProcessInput = Static<typeof RetrieveUserSchema>;
