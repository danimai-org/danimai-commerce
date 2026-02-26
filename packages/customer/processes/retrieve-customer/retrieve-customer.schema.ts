import { Type, type Static } from "@sinclair/typebox";

export const RetrieveCustomerSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveCustomerProcessInput = Static<
  typeof RetrieveCustomerSchema
>;

export const CustomerResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  first_name: Type.Union([Type.String(), Type.Null()]),
  last_name: Type.Union([Type.String(), Type.Null()]),
  phone: Type.Union([Type.String(), Type.Null()]),
  has_account: Type.Boolean(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export type CustomerProcessOutput = Static<typeof CustomerResponseSchema>;

export const RetrieveCustomerResponseSchema = Type.Union([
  CustomerResponseSchema,
  Type.Undefined(),
]);
export type RetrieveCustomerProcessOutput = Static<
  typeof RetrieveCustomerResponseSchema
>;
