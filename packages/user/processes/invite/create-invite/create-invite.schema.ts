import { Type, type Static } from "typebox";

export const CreateInviteSchema = Type.Object({
  email: Type.String({ format: "email" }),
  role_id: Type.Optional(Type.String({ format: "uuid" })),
});

export type CreateInviteProcessInput = Static<typeof CreateInviteSchema>;
