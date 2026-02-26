import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  FilterOperator,
  PaginationQuerySchema,
  PaginationSchema,
} from "@danimai/core";
import type { Order } from "@danimai/order/db";
import { OrderResponseSchema } from "../update-orders/update-orders.schema";

const paginationProperties = (PaginationSchema as unknown as { properties?: Record<string, ReturnType<typeof Type.Any>> })
  .properties ?? {};

const ordersFiltersSchema = createFilterableColumnsSchema<
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
});

export const PaginatedOrdersSchema = Type.Object({
  ...paginationProperties,
  filters: Type.Optional(ordersFiltersSchema),
});

/** Query-only schema for Elysia route (no Type.Transform). */
export const PaginatedOrdersQuerySchema = Type.Intersect([
  PaginationQuerySchema,
  Type.Object({
    filters: Type.Optional(ordersFiltersSchema),
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
