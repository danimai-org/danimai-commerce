import { Type, type Static } from "typebox";

export const ResendInviteSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
});

export type ResendInviteProcessInput = Static<typeof ResendInviteSchema>;
