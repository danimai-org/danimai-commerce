import { Type, type Static } from "typebox";

export const CheckLocationsInUseSchema = Type.Object({
  location_ids: Type.Array(Type.String()),
});

export type CheckLocationsInUseProcessInput = Static<
  typeof CheckLocationsInUseSchema
>;
