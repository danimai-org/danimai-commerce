import { Elysia } from "elysia";
import { StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_PERMISSIONS_PROCESS,
  RETRIEVE_PERMISSION_PROCESS,
  UPDATE_PERMISSION_PROCESS,
  PaginatedPermissionsProcess,
  RetrievePermissionProcess,
  UpdatePermissionProcess,
  PaginatedPermissionsSchema,
  PaginatedPermissionsResponseSchema,
  RetrievePermissionSchema,
  RetrievePermissionResponseSchema,
  UpdatePermissionSchema,
  UpdatePermissionResponseSchema,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const permissionRoutes = new Elysia({ prefix: "/permissions" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedPermissionsProcess>(PAGINATED_PERMISSIONS_PROCESS);
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedPermissionsSchema>,
      });
    },
    {
      query: PaginatedPermissionsSchema,
      response: {
        200: PaginatedPermissionsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Permissions"],
        summary: "Get paginated permissions",
        description: "Gets a paginated list of permissions",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrievePermissionProcess>(RETRIEVE_PERMISSION_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: RetrievePermissionSchema.properties.id }),
      response: {
        200: RetrievePermissionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Permissions"],
        summary: "Get permission by ID",
        description: "Retrieves a single permission by its ID",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdatePermissionProcess>(UPDATE_PERMISSION_PROCESS);
      const input = { ...(body as Record<string, unknown>), id: params.id };
      return process.runOperations({ input });
    },
    {
      params: Type.Object({ id: UpdatePermissionSchema.properties.id }),
      body: Type.Omit(UpdatePermissionSchema, ["id"]),
      response: {
        200: UpdatePermissionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Permissions"],
        summary: "Update permission",
        description: "Updates a permission by ID (name and/or description)",
      },
    }
  );
