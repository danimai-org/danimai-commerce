import { Type, type Static } from "@sinclair/typebox";

export const VerifyCustomerSchema = Type.Object({
  token: Type.String({
    minLength: 1,
    description: "Raw verification token from signup email",
  }),
});

export type VerifyCustomerProcessInput = Static<typeof VerifyCustomerSchema>;

export const VerifyCustomerResponseSchema = Type.Object({
  customer_id: Type.String({ format: "uuid" }),
});

export type VerifyCustomerResponse = Static<typeof VerifyCustomerResponseSchema>;
