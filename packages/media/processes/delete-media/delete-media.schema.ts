import { Type, type Static } from "@sinclair/typebox";

export const DeleteMediaSchema = Type.Object({
  ids: Type.Array(Type.String({ format: "uuid" }), { minItems: 1 }),
  owner_type: Type.Optional(Type.String()),
  owner_id: Type.Optional(Type.String({ format: "uuid" })),
});

export type DeleteMediaProcessInput = Static<typeof DeleteMediaSchema>;
