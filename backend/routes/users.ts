import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_USERS_PROCESS,
  PaginatedUsersProcess,
  type PaginatedUsersProcessInput,
  PaginatedUsersSchema,
} from "@danimai/user";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const userRoutes = new Elysia({ prefix: "/users" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedUsersProcess>(PAGINATED_USERS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(PaginatedUsersSchema, query) as PaginatedUsersProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["users"],
        summary: "Get paginated users",
        description: "Gets a paginated list of users",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  );
