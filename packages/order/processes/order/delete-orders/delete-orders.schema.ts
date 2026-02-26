import { Type, type Static } from "@sinclair/typebox";

export const DeleteOrdersSchema = Type.Object({
  order_ids: Type.Array(Type.String()),
});

export type DeleteOrdersProcessInput = Static<typeof DeleteOrdersSchema>;

export const DeleteOrdersResponseSchema = Type.Undefined();
export type DeleteOrdersProcessOutput = void;
