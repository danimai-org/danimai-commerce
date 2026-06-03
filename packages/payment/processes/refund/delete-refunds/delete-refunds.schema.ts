import { Type, type Static } from "@sinclair/typebox";

export const DeleteRefundsSchema = Type.Object({
  refund_ids: Type.Array(Type.String({ format: "uuid" }), {
    description: "Array of refund IDs to delete",
  }),
});

export type DeleteRefundsProcessInput = Static<typeof DeleteRefundsSchema>;

export const DeleteRefundsResponseSchema = Type.Undefined();
export type DeleteRefundsProcessOutput = void;
