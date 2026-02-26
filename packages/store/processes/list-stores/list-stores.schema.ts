import { Type, type Static } from "@sinclair/typebox";
import { StoreResponseSchema } from "../retrieve-store/retrieve-store.schema";

export const ListStoresSchema = Type.Object({
  name: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0 })),
});

export type ListStoresProcessInput = Static<typeof ListStoresSchema>;

export const ListStoresResponseSchema = Type.Array(StoreResponseSchema);

export type ListStoresProcessOutput = Static<typeof ListStoresResponseSchema>;
