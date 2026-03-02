import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
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
  PaginatedRolesResponseSchema,
  RetrieveRoleResponseSchema,
  CreateRoleSchema,
  CreateRoleResponseSchema,
  UpdateRoleSchema,
  UpdateRoleResponseSchema,
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
      return process.runOperations({ input });
    },
    {
      query: PaginatedRolesSchema,
      response: {
        200: PaginatedRolesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Roles"],
        summary: "Get paginated roles",
        description: "Gets a paginated list of roles",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveRoleProcess>(RETRIEVE_ROLE_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: RetrieveRoleResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Roles"],
        summary: "Get role by ID",
        description: "Retrieves a single role by its ID",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateRoleProcess>(CREATE_ROLE_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateRoleSchema,
      response: {
        200: CreateRoleResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Roles"],
        summary: "Create role",
        description: "Creates a new role",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateRoleProcess>(UPDATE_ROLE_PROCESS);
      const input = { ...(body as Record<string, unknown>), id: params.id };
      return process.runOperations({ input });
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: Type.Omit(UpdateRoleSchema, ["id"]),
      response: {
        200: UpdateRoleResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Roles"],
        summary: "Update role",
        description: "Updates an existing role by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteRolesProcess>(DELETE_ROLES_PROCESS);
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteRolesSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Roles"],
        summary: "Delete roles",
        description: "Deletes multiple roles by their IDs",
      },
    }
  );
