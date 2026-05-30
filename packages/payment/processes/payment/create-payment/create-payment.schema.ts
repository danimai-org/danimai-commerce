import { Type, type Static } from "@sinclair/typebox";
import { PaymentResponseSchema } from "../update-payment/update-payment.schema";

export const CreatePaymentSchema = Type.Object({
  order_id: Type.String(),
  customer_id: Type.String(),
  provider_id: Type.String({ format: "uuid" }),
});

export type CreatePaymentProcessInput = Static<typeof CreatePaymentSchema>;

export const CreatePaymentResponseSchema = Type.Union([PaymentResponseSchema]);
export type CreatePaymentProcessOutput = Static<
  typeof CreatePaymentResponseSchema
>;
