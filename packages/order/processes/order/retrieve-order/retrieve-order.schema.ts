import { Type, type Static } from "@sinclair/typebox";
import { OrderResponseSchema } from "../update-orders/update-orders.schema";

export const RetrieveOrderSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveOrderProcessInput = Static<typeof RetrieveOrderSchema>;

export const RetrieveOrderResponseSchema = Type.Union([
  OrderResponseSchema,
  Type.Undefined(),
]);
export type RetrieveOrderProcessOutput = Static<
  typeof RetrieveOrderResponseSchema
>;
