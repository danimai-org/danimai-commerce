import { Type, type Static } from "@sinclair/typebox";

export const DeleteReturnReasonsSchema = Type.Object({
  return_reason_ids: Type.Array(Type.String()),
});

export type DeleteReturnReasonsProcessInput = Static<typeof DeleteReturnReasonsSchema>;

export const DeleteReturnReasonsResponseSchema = Type.Undefined();
export type DeleteReturnReasonsProcessOutput = void;
