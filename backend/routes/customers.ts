import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_CUSTOMERS_PROCESS,
  PaginatedCustomersProcess,
  type PaginatedCustomersProcessInput,
  PaginatedCustomersSchema,
} from "@danimai/customer";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const customerRoutes = new Elysia({ prefix: "/customers" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedCustomersProcess>(
          PAGINATED_CUSTOMERS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(
            PaginatedCustomersSchema,
            query
          ) as PaginatedCustomersProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customers"],
        summary: "Get paginated customers",
        description: "Gets a paginated list of customers",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  );
