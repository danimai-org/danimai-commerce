import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_PERMISSIONS_PROCESS,
  RETRIEVE_PERMISSION_PROCESS,
  UPDATE_PERMISSION_PROCESS,
  PaginatedPermissionsProcess,
  RetrievePermissionProcess,
  UpdatePermissionProcess,
  type PaginatedPermissionsProcessInput,
  type UpdatePermissionProcessInput,
  PaginatedPermissionsSchema,
  UpdatePermissionSchema,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";
import Value from "typebox/value";

export const permissionRoutes = new Elysia({ prefix: "/permissions" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedPermissionsProcess>(PAGINATED_PERMISSIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(PaginatedPermissionsSchema, query) as PaginatedPermissionsProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["permissions"],
        summary: "Get paginated permissions",
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
        const process = getService<RetrievePermissionProcess>(RETRIEVE_PERMISSION_PROCESS);
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
        tags: ["permissions"],
        summary: "Get permission by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const process = getService<UpdatePermissionProcess>(UPDATE_PERMISSION_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(UpdatePermissionSchema, { ...(body as object), id: params.id }) as UpdatePermissionProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["permissions"],
        summary: "Update permission",
        description: "Updates a permission by ID (name and/or description)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              example: { name: "product:create", description: "Permission to create products" },
            },
          },
        },
      },
    }
  );
