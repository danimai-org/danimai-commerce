import { Type, type Static } from "@sinclair/typebox";
import { CustomerResponseSchema } from "../retrieve-customer/retrieve-customer.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateCustomerSchema = Type.Object({
  email: Type.String(),
  first_name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  last_name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  has_account: Type.Optional(Type.Boolean()),
  active: Type.Optional(Type.Boolean()),
  metadata: Metadata,
});

export const CreateCustomersSchema = Type.Object({
  customers: Type.Array(CreateCustomerSchema),
});

export type CreateCustomerProcessInput = Static<typeof CreateCustomerSchema>;
export type CreateCustomersProcessInput = Static<typeof CreateCustomersSchema>;

/** One created customer — aligned with {@link CustomerResponseSchema}. */
export const CreateCustomerResponseSchema = CustomerResponseSchema;

/** Response array from the create-customers process. */
export const CreateCustomersResponseSchema = Type.Array(
  CreateCustomerResponseSchema,
);

export type CreateCustomerResponseOutput = Static<
  typeof CreateCustomerResponseSchema
>;
export type CreateCustomersProcessOutput = Static<
  typeof CreateCustomersResponseSchema
>;
