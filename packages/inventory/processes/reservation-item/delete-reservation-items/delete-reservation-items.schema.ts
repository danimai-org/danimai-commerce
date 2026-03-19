import { Type, type Static } from "@sinclair/typebox";

export const DeleteReservationItemsSchema = Type.Object({
  ids: Type.Array(Type.String(), { uniqueItems: true, minItems: 1 }),
});

export type DeleteReservationItemsProcessInput = Static<
  typeof DeleteReservationItemsSchema
>;

export const DeleteReservationItemsResponseSchema = Type.Undefined();
export type DeleteReservationItemsProcessOutput = void;
