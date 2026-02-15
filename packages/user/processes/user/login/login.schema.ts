import { Type, type Static } from "typebox";

export const LoginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 1 }),
});

export type LoginProcessInput = Static<typeof LoginSchema>;
