import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_ORDERS_PROCESS,
  PaginatedOrdersProcess,
  type PaginatedOrdersProcessInput,
  PaginatedOrdersSchema,
} from "@danimai/order";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

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
  );
