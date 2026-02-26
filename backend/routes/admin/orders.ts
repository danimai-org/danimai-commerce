import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, DANIMAI_DB, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import type { Kysely } from "kysely";
import {
  PAGINATED_ORDERS_PROCESS,
  PaginatedOrdersProcess,
  PaginatedOrdersSchema,
  PaginatedOrdersResponseSchema,
  CREATE_ORDERS_PROCESS,
  CreateOrdersProcess,
  CreateOrdersSchema,
  CreateOrdersResponseSchema,
  UPDATE_ORDERS_PROCESS,
  UpdateOrdersProcess,
  UpdateOrderResponseSchema,
  OrderResponseSchema,
  type Database,
} from "@danimai/order";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const OrderStatus = Type.Union([
  Type.Literal("pending"),
  Type.Literal("completed"),
  Type.Literal("archived"),
  Type.Literal("canceled"),
  Type.Literal("requires_action"),
]);
const FulfillmentStatus = Type.Union([
  Type.Literal("not_fulfilled"),
  Type.Literal("partially_fulfilled"),
  Type.Literal("fulfilled"),
  Type.Literal("partially_shipped"),
  Type.Literal("shipped"),
  Type.Literal("partially_returned"),
  Type.Literal("returned"),
  Type.Literal("canceled"),
  Type.Literal("requires_action"),
]);
const PaymentStatus = Type.Union([
  Type.Literal("not_paid"),
  Type.Literal("awaiting"),
  Type.Literal("captured"),
  Type.Literal("partially_refunded"),
  Type.Literal("refunded"),
  Type.Literal("canceled"),
  Type.Literal("requires_action"),
]);

const UpdateOrderBodySchema = Type.Object({
  status: Type.Optional(OrderStatus),
  fulfillment_status: Type.Optional(FulfillmentStatus),
  payment_status: Type.Optional(PaymentStatus),
  email: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  customer_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  sales_channel_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  region_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  billing_address_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  shipping_address_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Type.Optional(Type.Unknown()),
});

export const orderRoutes = new Elysia({ prefix: "/orders" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedOrdersProcess>(PAGINATED_ORDERS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedOrdersSchema as any,
      response: {
        200: PaginatedOrdersResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Orders"],
        summary: "Get paginated orders",
        description: "Gets a paginated list of orders",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateOrdersProcess>(CREATE_ORDERS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const result = await process.runOperations({ input, logger } as any);
      return { data: result };
    },
    {
      body: CreateOrdersSchema as any,
      response: {
        200: Type.Object({ data: CreateOrdersResponseSchema }),
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Orders"],
        summary: "Create orders",
        description: "Creates one or more orders",
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const db = getService<Kysely<Database>>(DANIMAI_DB);
      const order = await db
        .selectFrom("orders")
        .where("id", "=", params.id)
        .where("deleted_at", "is", null)
        .selectAll()
        .executeTakeFirst();

      if (!order) {
        set.status = 404;
        return { message: "Order not found" };
      }

      return order;
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      response: {
        200: OrderResponseSchema,
        404: Type.Object({ message: Type.String() }),
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Orders"],
        summary: "Get an order by ID",
        description: "Retrieves a single order by its ID",
      },
    }
  )
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      const process = getService<UpdateOrdersProcess>(UPDATE_ORDERS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { ...(body as Record<string, unknown>), id: params.id };
      const result = await process.runOperations({ input, logger } as any);
      if (!result) {
        set.status = 404;
        return { message: "Order not found" };
      }
      return result;
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateOrderBodySchema as any,
      response: {
        200: UpdateOrderResponseSchema,
        404: Type.Object({ message: Type.String() }),
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Orders"],
        summary: "Update an order",
        description: "Updates an order by ID",
      },
    }
  );
