import { Type, type Static } from "typebox";

export const DeleteStoresSchema = Type.Object({
  store_ids: Type.Array(Type.String()),
});

export type DeleteStoresProcessInput = Static<typeof DeleteStoresSchema>;
