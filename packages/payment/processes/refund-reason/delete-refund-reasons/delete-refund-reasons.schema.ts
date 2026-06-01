import { Type, type Static } from "@sinclair/typebox";

export const DeleteRefundReasonsSchema = Type.Object({
  refund_reason_ids: Type.Array(Type.String({ format: "uuid" }), {
    description: "Array of refund reason IDs to delete",
  }),
});

export type DeleteRefundReasonsProcessInput = Static<
  typeof DeleteRefundReasonsSchema
>;

export const DeleteRefundReasonsResponseSchema = Type.Undefined();
export type DeleteRefundReasonsProcessOutput = void;
