import { Elysia } from "elysia";
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
  type PaginatedRolesProcessInput,
  type CreateRoleProcessInput,
  type UpdateRoleProcessInput,
  type DeleteRolesProcessInput,
  PaginatedRolesSchema,
  CreateRoleSchema,
  UpdateRoleSchema,
  DeleteRolesSchema,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";
import Value from "typebox/value";

export const roleRoutes = new Elysia({ prefix: "/roles" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedRolesProcess>(PAGINATED_ROLES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(PaginatedRolesSchema, query) as PaginatedRolesProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["roles"],
        summary: "Get paginated roles",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const process = getService<RetrieveRoleProcess>(RETRIEVE_ROLE_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["roles"],
        summary: "Get role by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<CreateRoleProcess>(CREATE_ROLE_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(CreateRoleSchema, body) as CreateRoleProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["roles"],
        summary: "Create role",
        requestBody: {
          content: {
            "application/json": {
              example: { name: "admin", description: "Administrator" },
            },
          },
        },
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const process = getService<UpdateRoleProcess>(UPDATE_ROLE_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(UpdateRoleSchema, { ...(body as object), id: params.id }) as UpdateRoleProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["roles"],
        summary: "Update role",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              example: { name: "editor", description: "Content editor" },
            },
          },
        },
      },
    }
  )
  .delete(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<DeleteRolesProcess>(DELETE_ROLES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(DeleteRolesSchema, body) as DeleteRolesProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["roles"],
        summary: "Delete roles",
        requestBody: {
          content: {
            "application/json": {
              example: { role_ids: ["550e8400-e29b-41d4-a716-446655440000"] },
            },
          },
        },
      },
    }
  );
