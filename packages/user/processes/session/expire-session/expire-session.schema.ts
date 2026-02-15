import { Type, type Static } from "typebox";

export const ExpireSessionSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
});

export type ExpireSessionProcessInput = Static<typeof ExpireSessionSchema>;
