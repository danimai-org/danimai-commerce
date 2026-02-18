import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_USERS_PROCESS,
  PaginatedUsersProcess,
  type PaginatedUsersProcessInput,
  PaginatedUsersSchema,
  UPDATE_USER_PROCESS,
  UpdateUserProcess,
  type UpdateUserProcessInput,
  UpdateUserSchema,
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
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const process = getService<UpdateUserProcess>(UPDATE_USER_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(UpdateUserSchema, { ...(body as object), id: params.id }) as UpdateUserProcessInput;
        const result = await process.runOperations({ input, logger });
        if (result && "password_hash" in result) {
          const { password_hash: _p, ...user } = result;
          return user;
        }
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["users"],
        summary: "Update user",
        description: "Updates a user by id (e.g. first_name, last_name)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              example: { first_name: "Jane", last_name: "Doe" },
            },
          },
        },
      },
    }
  );
