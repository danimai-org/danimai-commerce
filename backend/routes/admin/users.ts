import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_USERS_PROCESS,
  PaginatedUsersProcess,
  PaginatedUsersSchema,
  PaginatedUsersResponseSchema,
  UPDATE_USER_PROCESS,
  UpdateUserProcess,
  UpdateUserSchema,
  UpdateUserResponseSchema,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateUserBodySchema = Type.Object({
  first_name: Type.Optional(Type.String()),
  last_name: Type.Optional(Type.String()),
});

const toDateString = (v: string | Date | null): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : v;

function serializeUserDates<T extends Record<string, unknown>>(user: T): T {
  return {
    ...user,
    created_at: toDateString(user.created_at as string | Date | null) ?? user.created_at,
    updated_at: toDateString(user.updated_at as string | Date | null) ?? user.updated_at,
    deleted_at: toDateString(user.deleted_at as string | Date | null),
  } as T;
}

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
      response: {
        200: PaginatedUsersResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
        return serializeUserDates(user);
      }
      return result ? serializeUserDates(result) : result;
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateUserBodySchema as any,
      response: {
        200: UpdateUserResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Users"],
        summary: "Update user",
        description: "Updates a user by id (e.g. first_name, last_name)",
      },
    }
  );

