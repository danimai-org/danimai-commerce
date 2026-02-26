import { Type, type Static } from "@sinclair/typebox";

export const DeleteInventoryLevelSchema = Type.Object({
  id: Type.String(),
});

export type DeleteInventoryLevelProcessInput = Static<
  typeof DeleteInventoryLevelSchema
>;

export const DeleteInventoryLevelResponseSchema = Type.Undefined();
export type DeleteInventoryLevelProcessOutput = void;
