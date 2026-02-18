import { Type, type Static } from "typebox";

export const UpdateUserSchema = Type.Object({
  id: Type.String(),
  first_name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  last_name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  role_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type UpdateUserProcessInput = Static<typeof UpdateUserSchema>;
