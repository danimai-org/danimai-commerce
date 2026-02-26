import { Type, type Static } from "@sinclair/typebox";

export const DeleteStoresSchema = Type.Object({
  store_ids: Type.Array(Type.String()),
});

export type DeleteStoresProcessInput = Static<typeof DeleteStoresSchema>;

export const DeleteStoresResponseSchema = Type.Undefined();

export type DeleteStoresProcessOutput = void;
