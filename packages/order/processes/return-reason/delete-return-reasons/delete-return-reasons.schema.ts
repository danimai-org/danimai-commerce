import { Type, type Static } from "typebox";

export const DeleteReturnReasonsSchema = Type.Object({
  return_reason_ids: Type.Array(Type.String()),
});

export type DeleteReturnReasonsProcessInput = Static<typeof DeleteReturnReasonsSchema>;
