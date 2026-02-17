import { Type, type Static } from "typebox";

export const DeleteInventoryLevelSchema = Type.Object({
  id: Type.String(),
});

export type DeleteInventoryLevelProcessInput = Static<
  typeof DeleteInventoryLevelSchema
>;
