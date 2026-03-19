import { Type, type Static } from "@sinclair/typebox";

export const RetrieveReservationItemSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveReservationItemProcessInput = Static<
  typeof RetrieveReservationItemSchema
>;

export const ReservationItemResponseSchema = Type.Object({
  id: Type.String(),
  inventory_item_id: Type.String(),
  location_id: Type.String(),
  quantity: Type.Number(),
  line_item_id: Type.Union([Type.String(), Type.Null()]),
  description: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveReservationItemResponseSchema = Type.Union([
  ReservationItemResponseSchema,
  Type.Undefined(),
]);

export type RetrieveReservationItemProcessOutput = Static<
  typeof RetrieveReservationItemResponseSchema
>;
