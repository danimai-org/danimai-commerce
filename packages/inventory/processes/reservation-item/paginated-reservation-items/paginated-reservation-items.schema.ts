import { Type, type Static } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ReservationItemResponseSchema } from "../retrieve-reservation-item/retrieve-reservation-item.schema";

export const PaginatedReservationItemsSchema = createPaginationSchema(
  Type.Object({
    inventory_item_id: Type.Optional(Type.String()),
    location_id: Type.Optional(Type.String()),
    line_item_id: Type.Optional(Type.String()),
  }),
  [
    "reservation_items.created_at",
    "reservation_items.updated_at",
    "reservation_items.quantity",
  ]
);

export type PaginatedReservationItemsProcessInput = Static<
  typeof PaginatedReservationItemsSchema
>;

export const PaginatedReservationItemsResponseSchema =
  createPaginatedResponseSchema(ReservationItemResponseSchema);
export type PaginatedReservationItemsProcessOutput = Static<
  typeof PaginatedReservationItemsResponseSchema
>;
