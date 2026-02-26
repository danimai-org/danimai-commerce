import { Type, type Static } from "@sinclair/typebox";

export const CheckLocationsInUseSchema = Type.Object({
  location_ids: Type.Array(Type.String()),
});

export type CheckLocationsInUseProcessInput = Static<
  typeof CheckLocationsInUseSchema
>;

export const CheckLocationsInUseResponseSchema = Type.Undefined();
export type CheckLocationsInUseProcessOutput = void;
