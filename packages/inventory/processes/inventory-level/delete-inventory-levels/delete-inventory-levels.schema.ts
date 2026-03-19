import { Type, type Static } from "@sinclair/typebox";

export const DeleteInventoryLevelsSchema = Type.Object({
  ids: Type.Array(Type.String({ format: "uuid" })),
});

export type DeleteInventoryLevelsProcessInput = Static<
  typeof DeleteInventoryLevelsSchema
>;

export const DeleteInventoryLevelsResponseSchema = Type.Undefined();
export type DeleteInventoryLevelsProcessOutput = void;
