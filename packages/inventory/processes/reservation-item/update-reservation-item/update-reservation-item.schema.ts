import { Type, type Static } from "@sinclair/typebox";
import { ReservationItemResponseSchema } from "../retrieve-reservation-item/retrieve-reservation-item.schema";
export const UpdateReservationItemParamSchema = Type.Object({
  id: Type.String(),
});
export const UpdateReservationItemSchema = Type.Object({
  ...UpdateReservationItemParamSchema.properties,
  location_id: Type.Optional(Type.String({ format: "uuid" })),
  quantity: Type.Optional(Type.Number()),
  line_item_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Type.Optional(
    Type.Union([
      Type.Record(
        Type.String(),
        Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
      ),
      Type.Null(),
    ])
  ),
});

export type UpdateReservationItemProcessInput = Static<
  typeof UpdateReservationItemSchema
>;

export const UpdateReservationItemResponseSchema = Type.Union([
  ReservationItemResponseSchema,
  Type.Undefined(),
]);
export type UpdateReservationItemProcessOutput = Static<
  typeof UpdateReservationItemResponseSchema
>;
