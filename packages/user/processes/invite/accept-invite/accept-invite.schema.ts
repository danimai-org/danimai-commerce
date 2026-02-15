import { Type, type Static } from "typebox";

export const AcceptInviteSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 8 }),
});

export type AcceptInviteProcessInput = Static<typeof AcceptInviteSchema>;
