import { Type, type Static } from "@sinclair/typebox";
import { ReservationItemResponseSchema } from "../retrieve-reservation-item/retrieve-reservation-item.schema";

const MetadataSchema = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateReservationItemSchema = Type.Object({
  inventory_item_id: Type.String({ format: "uuid" }),
  location_id: Type.String({ format: "uuid" }),
  quantity: Type.Number({ minimum: 1 }),
  line_item_id: Type.Optional(Type.Union([Type.String({ format: "uuid" }), Type.Null()])),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: MetadataSchema,
});


export type CreateReservationItemProcessInput = Static<
  typeof CreateReservationItemSchema
>;

export const CreateReservationItemResponseSchema = ReservationItemResponseSchema;
export type CreateReservationItemProcessOutput = Static<
  typeof CreateReservationItemResponseSchema
>;
