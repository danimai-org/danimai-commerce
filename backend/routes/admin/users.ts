import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_USERS_PROCESS,
  PaginatedUsersProcess,
  PaginatedUsersSchema,
  UPDATE_USER_PROCESS,
  UpdateUserProcess,
  UpdateUserSchema,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";

const UpdateUserBodySchema = Type.Object({
  first_name: Type.Optional(Type.String()),
  last_name: Type.Optional(Type.String()),
});

export const userRoutes = new Elysia({ prefix: "/users" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedUsersProcess>(PAGINATED_USERS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedUsersSchema as any,
      detail: {
        tags: ["Users"],
        summary: "Get paginated users",
        description: "Gets a paginated list of users",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateUserProcess>(UPDATE_USER_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { ...(body as Record<string, unknown>), id: params.id };
      const result = await process.runOperations({ input, logger } as any);
      if (result && "password_hash" in result) {
        const { password_hash: _p, ...user } = result;
        return user;
      }
      return result;
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateUserBodySchema as any,
      
      detail: {
        tags: ["Users"],
        summary: "Update user",
        description: "Updates a user by id (e.g. first_name, last_name)",
      },
    }
  );

