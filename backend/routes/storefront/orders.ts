import { Elysia } from "elysia";
import { type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import { Type } from "@sinclair/typebox";
import {
  CREATE_ORDER_FROM_CART_PROCESS,
  CreateOrderFromCartProcess,
  CreateOrderFromCartSchema,
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

export const storefrontOrderRoutes = new Elysia({ prefix: "/orders" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .post(
    "/from-cart",
    async ({ body }: { body: StaticDecode<typeof CreateOrderFromCartSchema> }) => {
      const process = getService<CreateOrderFromCartProcess>(
        CREATE_ORDER_FROM_CART_PROCESS
      );
      return process.runOperations({ input: body });
    },
    {
      body: CreateOrderFromCartSchema,
      response: {
        200: OrderResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Orders"],
        summary: "Create order from cart",
        description:
          "Builds an order from a cart (line items, tax lines, shipping snapshot), marks the cart completed",
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
        tags: ["Storefront Orders"],
        summary: "Get order by ID",
        description:
          "Returns a single order with persisted line-item snapshots, addresses, and payment metadata",
      },
    }
  );
