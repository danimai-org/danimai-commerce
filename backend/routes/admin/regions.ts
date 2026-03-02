import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_REGIONS_PROCESS,
  CREATE_REGIONS_PROCESS,
  UPDATE_REGIONS_PROCESS,
  DELETE_REGIONS_PROCESS,
  PaginatedRegionsProcess,
  CreateRegionsProcess,
  UpdateRegionsProcess,
  DeleteRegionsProcess,
  PaginatedRegionsSchema,
  PaginatedRegionsResponseSchema,
  CreateRegionsSchema,
  CreateRegionsResponseSchema,
  UpdateRegionSchema,
  UpdateRegionResponseSchema,
  DeleteRegionsSchema,
} from "@danimai/region";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateRegionBodySchema = Type.Object({
  name: Type.Optional(Type.String()),
  currency_code: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]))),
});

export const regionRoutes = new Elysia({ prefix: "/regions" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedRegionsProcess>(PAGINATED_REGIONS_PROCESS);
      return process.runOperations({ input });
    },
    {
      query: PaginatedRegionsSchema,
      response: {
        200: PaginatedRegionsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Regions"],
        summary: "Get paginated regions",
        description: "Gets a paginated list of regions",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateRegionsProcess>(CREATE_REGIONS_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateRegionsSchema,
      response: {
        200: CreateRegionsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Regions"],
        summary: "Create region(s)",
        description: "Creates one or more regions",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateRegionsProcess>(UPDATE_REGIONS_PROCESS);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateRegionBodySchema,
      response: {
        200: UpdateRegionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Regions"],
        summary: "Update a region",
        description: "Updates an existing region by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteRegionsProcess>(DELETE_REGIONS_PROCESS);
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteRegionsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Regions"],
        summary: "Delete regions",
        description: "Deletes multiple regions by their IDs",
      },
    }
  );
