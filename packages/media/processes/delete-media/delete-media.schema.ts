import { Type, type Static } from "@sinclair/typebox";

export const DeleteMediaSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
});

export type DeleteMediaProcessInput = Static<typeof DeleteMediaSchema>;
