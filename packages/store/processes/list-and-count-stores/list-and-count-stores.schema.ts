import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const ListAndCountStoresSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    name: Type.Optional(Type.String()),
  }),
]);

export type ListAndCountStoresProcessInput = Static<
  typeof ListAndCountStoresSchema
>;
