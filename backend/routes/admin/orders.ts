import { Elysia } from "elysia";
import { Type, type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_ORDERS_PROCESS,
  PaginatedOrdersProcess,
  PaginatedOrdersQuerySchema,
  PaginatedOrdersResponseSchema,
  CREATE_ORDERS_PROCESS,
  CreateOrdersProcess,
  CreateOrdersSchema,
  CreateOrdersResponseSchema,
  UPDATE_ORDERS_PROCESS,
  UpdateOrdersProcess,
  UpdateOrderSchema,
  UpdateOrderResponseSchema,
  OrderResponseSchema,
  RETRIEVE_ORDER_PROCESS,
  RetrieveOrderProcess,
  RetrieveOrderSchema,
} from "@danimai/order";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateOrderBodySchema = Type.Omit(UpdateOrderSchema, ["id"]);

export const orderRoutes = new Elysia({ prefix: "/orders" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedOrdersProcess>(PAGINATED_ORDERS_PROCESS);
      return process.runOperations({
        input: input as StaticDecode<typeof PaginatedOrdersQuerySchema>,
      });
    },
    {
      query: PaginatedOrdersQuerySchema,
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
    async ({ body: input }: { body: StaticDecode<typeof CreateOrdersSchema> }) => {
      const process = getService<CreateOrdersProcess>(CREATE_ORDERS_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateOrdersSchema,
      response: {
        200: CreateOrdersResponseSchema,
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
    async ({ params }) => {
      const process = getService<RetrieveOrderProcess>(RETRIEVE_ORDER_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: RetrieveOrderSchema.properties.id }),
      response: {
        200: OrderResponseSchema,
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
    async ({
      params,
      body,
    }: {
      params: { id: string };
      body: StaticDecode<typeof UpdateOrderBodySchema>;
    }) => {
      const process = getService<UpdateOrdersProcess>(UPDATE_ORDERS_PROCESS);
      return process.runOperations({
        input: {
          ...body,
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: UpdateOrderSchema.properties.id }),
      body: UpdateOrderBodySchema,
      response: {
        200: UpdateOrderResponseSchema,
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
