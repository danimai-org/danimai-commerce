import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedRegionsSchema as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateRegionsSchema as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateRegionBodySchema as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteRegionsSchema as any,
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
