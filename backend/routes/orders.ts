import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_ORDERS_PROCESS,
  PaginatedOrdersProcess,
  type PaginatedOrdersProcessInput,
  PaginatedOrdersSchema,
  CREATE_ORDERS_PROCESS,
  CreateOrdersProcess,
  type CreateOrdersProcessInput,
  CreateOrdersSchema,
  type Order,
  type Database,
} from "@danimai/order";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";
import { getService, DANIMAI_DB } from "@danimai/core";
import type { Kysely } from "kysely";

export const orderRoutes = new Elysia({ prefix: "/orders" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedOrdersProcess>(
          PAGINATED_ORDERS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(
            PaginatedOrdersSchema,
            query
          ) as PaginatedOrdersProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["orders"],
        summary: "Get paginated orders",
        description: "Gets a paginated list of orders",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<CreateOrdersProcess>(
          CREATE_ORDERS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(
            CreateOrdersSchema,
            body
          ) as CreateOrdersProcessInput,
          logger,
        });
        return { data: result };
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["orders"],
        summary: "Create orders",
        description: "Creates one or more orders",
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
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
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["orders"],
        summary: "Get an order by ID",
        description: "Retrieves a single order by its ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
      },
    }
  );
