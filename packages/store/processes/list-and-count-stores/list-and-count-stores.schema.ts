import { Type, type Static } from "@sinclair/typebox";
import { PaginationSchema } from "@danimai/core";
import { StoreResponseSchema } from "../retrieve-store/retrieve-store.schema";

export const ListAndCountStoresSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    name: Type.Optional(Type.String()),
  }),
]);

export type ListAndCountStoresProcessInput = Static<
  typeof ListAndCountStoresSchema
>;

export const ListAndCountStoresResponseSchema = Type.Object({
  data: Type.Array(StoreResponseSchema),
  count: Type.Number(),
});

export type ListAndCountStoresProcessOutput = Static<typeof ListAndCountStoresResponseSchema>;
