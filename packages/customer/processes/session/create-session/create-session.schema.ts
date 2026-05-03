import { Type, type Static } from "@sinclair/typebox";

export const DEFAULT_CUSTOMER_SESSION_TTL_DAYS = 90;

export const CreateCustomerSessionSchema = Type.Object({
  ip_address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  user_agent: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type CreateCustomerSessionProcessInput = Static<
  typeof CreateCustomerSessionSchema
>;

export const CustomerSessionResponseSchema = Type.Object({
  id: Type.String(),
  customer_id: Type.Union([Type.String(), Type.Null()]),
  parent_id: Type.Union([Type.String(), Type.Null()]),
  refresh_token_hash: Type.Union([Type.String(), Type.Null()]),
  ip_address: Type.Union([Type.String(), Type.Null()]),
  user_agent: Type.Union([Type.String(), Type.Null()]),
  expires_at: Type.String(),
  logged_out_at: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
});

export const CreateCustomerSessionResultSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "Session id for JWT sid claim",
  }),
});

export const CreateCustomerSessionResponseSchema = Type.Union([
  CreateCustomerSessionResultSchema,
  Type.Undefined(),
]);
export type CreateCustomerSessionProcessOutput = Static<
  typeof CreateCustomerSessionResponseSchema
>;
