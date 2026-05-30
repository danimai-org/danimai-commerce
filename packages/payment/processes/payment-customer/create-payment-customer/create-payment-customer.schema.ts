import { Type, type Static } from "@sinclair/typebox";
import {
  PaymentCustomerResponseSchema,
  StripeCustomerFieldsSchema,
} from "../update-payment-customer/update-payment-customer.schema";

export const CreatePaymentCustomerSchema = Type.Object({
  customer_id: Type.String(),
  provider_id: Type.String({ format: "uuid" }),
  ...StripeCustomerFieldsSchema,
});

export type CreatePaymentCustomerProcessInput = Static<
  typeof CreatePaymentCustomerSchema
>;

export const CreatePaymentCustomerResponseSchema = Type.Union([
  PaymentCustomerResponseSchema,
]);
export type CreatePaymentCustomerProcessOutput = Static<
  typeof CreatePaymentCustomerResponseSchema
>;
