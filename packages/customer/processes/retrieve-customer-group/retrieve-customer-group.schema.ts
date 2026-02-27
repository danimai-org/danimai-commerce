import { Type, type Static } from "@sinclair/typebox";

export const RetrieveCustomerGroupSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveCustomerGroupProcessInput = Static<
  typeof RetrieveCustomerGroupSchema
>;

export const CustomerGroupResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
  customer_count: Type.Number(),
});

export const RetrieveCustomerGroupResponseSchema = Type.Union([
  CustomerGroupResponseSchema,
  Type.Undefined(),
]);
export type RetrieveCustomerGroupProcessOutput = Static<
  typeof RetrieveCustomerGroupResponseSchema
>;

export const CustomerGroupEntitySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
});
