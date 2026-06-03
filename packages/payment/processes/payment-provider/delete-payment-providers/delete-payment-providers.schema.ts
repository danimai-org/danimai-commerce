import { Type, type Static } from "@sinclair/typebox";

export const DeletePaymentProvidersSchema = Type.Object({
  payment_provider_ids: Type.Array(
    Type.String({ format: "uuid" }),
    {
      description: "Array of payment provider IDs to delete",
    }
  ),
});

export type DeletePaymentProvidersProcessInput = Static<
  typeof DeletePaymentProvidersSchema
>;

export const DeletePaymentProvidersResponseSchema = Type.Undefined();
export type DeletePaymentProvidersProcessOutput = void;
