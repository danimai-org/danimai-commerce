import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { Order } from "@danimai/order/db";
import { OrderResponseSchema } from "../update-orders/update-orders.schema";

export const PaginatedOrdersSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    filters: Type.Optional(
      createFilterableColumnsSchema<
        keyof Pick<
          Order,
          "status" | "fulfillment_status" | "payment_status" | "customer_id" | "sales_channel_id" | "region_id"
        >
      >({
        status: [FilterOperator.EQUAL, FilterOperator.IN],
        fulfillment_status: [FilterOperator.EQUAL, FilterOperator.IN],
        payment_status: [FilterOperator.EQUAL, FilterOperator.IN],
        customer_id: [FilterOperator.EQUAL, FilterOperator.IN, FilterOperator.IS_NULL, FilterOperator.IS_NOT_NULL],
        sales_channel_id: [FilterOperator.EQUAL, FilterOperator.IN, FilterOperator.IS_NULL, FilterOperator.IS_NOT_NULL],
        region_id: [FilterOperator.EQUAL, FilterOperator.IN, FilterOperator.IS_NULL, FilterOperator.IS_NOT_NULL],
      })
    ),
  }),
]);

export type PaginatedOrdersProcessInput = Static<
  typeof PaginatedOrdersSchema
>;

export const PaginatedOrdersResponseSchema =
  createPaginatedResponseSchema(OrderResponseSchema);
export type PaginatedOrdersProcessOutput = Static<
  typeof PaginatedOrdersResponseSchema
>;
