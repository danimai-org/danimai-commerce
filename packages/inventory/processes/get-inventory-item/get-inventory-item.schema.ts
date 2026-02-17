import { Type, type Static } from "typebox";

export const GetInventoryItemSchema = Type.Object({
  id: Type.String(),
});

export type GetInventoryItemProcessInput = Static<
  typeof GetInventoryItemSchema
>;
