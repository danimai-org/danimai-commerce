import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_ROLES_PROCESS,
  RETRIEVE_ROLE_PROCESS,
  CREATE_ROLE_PROCESS,
  UPDATE_ROLE_PROCESS,
  DELETE_ROLES_PROCESS,
  PaginatedRolesProcess,
  RetrieveRoleProcess,
  CreateRoleProcess,
  UpdateRoleProcess,
  DeleteRolesProcess,
  PaginatedRolesSchema,
  CreateRoleSchema,
  UpdateRoleSchema,
  DeleteRolesSchema,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const roleRoutes = new Elysia({ prefix: "/roles" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedRolesProcess>(PAGINATED_ROLES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedRolesSchema as any,
      detail: {
        tags: ["Roles"],
        summary: "Get paginated roles",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveRoleProcess>(RETRIEVE_ROLE_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      detail: {
        tags: ["Roles"],
        summary: "Get role by ID",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateRoleProcess>(CREATE_ROLE_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateRoleSchema as any,
      detail: {
        tags: ["Roles"],
        summary: "Create role",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateRoleProcess>(UPDATE_ROLE_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { ...(body as Record<string, unknown>), id: params.id };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: Type.Omit(UpdateRoleSchema, ["id"]) as any,
      detail: {
        tags: ["Roles"],
        summary: "Update role",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteRolesProcess>(DELETE_ROLES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteRolesSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Roles"],
        summary: "Delete roles",
      },
    }
  );
