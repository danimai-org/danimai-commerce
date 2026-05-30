import { Elysia } from "elysia";
import { StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
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

const UpdateUserBodySchema = Type.Omit(UpdateUserSchema, ["id"]);

export const userRoutes = new Elysia({ prefix: "/users" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedUsersProcess>(PAGINATED_USERS_PROCESS);
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedUsersSchema>,
      });
    },
    {
      query: PaginatedUsersSchema,
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
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
    },
    {
      params: Type.Object({ id: UpdateUserSchema.properties.id }),
      body: UpdateUserBodySchema,
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
