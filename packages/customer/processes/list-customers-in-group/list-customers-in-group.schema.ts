import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const ListCustomersInGroupSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    customer_group_id: Type.String(),
  }),
]);

export type ListCustomersInGroupProcessInput = Static<
  typeof ListCustomersInGroupSchema
>;
