import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_PERMISSIONS_PROCESS,
  RETRIEVE_PERMISSION_PROCESS,
  UPDATE_PERMISSION_PROCESS,
  PaginatedPermissionsProcess,
  RetrievePermissionProcess,
  UpdatePermissionProcess,
  PaginatedPermissionsSchema,
  UpdatePermissionSchema,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";

export const permissionRoutes = new Elysia({ prefix: "/permissions" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedPermissionsProcess>(PAGINATED_PERMISSIONS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedPermissionsSchema as any,
      detail: {
        tags: ["Permissions"],
        summary: "Get paginated permissions",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrievePermissionProcess>(RETRIEVE_PERMISSION_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      detail: {
        tags: ["Permissions"],
        summary: "Get permission by ID",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdatePermissionProcess>(UPDATE_PERMISSION_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { ...(body as Record<string, unknown>), id: params.id };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: Type.Omit(UpdatePermissionSchema, ["id"]) as any,
      detail: {
        tags: ["Permissions"],
        summary: "Update permission",
        description: "Updates a permission by ID (name and/or description)",
      },
    }
  );
