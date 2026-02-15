import { Type, type Static } from "typebox";

export const DeleteOrdersSchema = Type.Object({
  order_ids: Type.Array(Type.String()),
});

export type DeleteOrdersProcessInput = Static<typeof DeleteOrdersSchema>;
