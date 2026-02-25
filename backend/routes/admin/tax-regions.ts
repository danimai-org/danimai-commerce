import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_TAX_REGIONS_PROCESS,
  CREATE_TAX_REGIONS_PROCESS,
  UPDATE_TAX_REGIONS_PROCESS,
  DELETE_TAX_REGIONS_PROCESS,
  PaginatedTaxRegionsProcess,
  CreateTaxRegionsProcess,
  UpdateTaxRegionsProcess,
  DeleteTaxRegionsProcess,
  PaginatedTaxRegionsSchema,
  CreateTaxRegionsSchema,
  UpdateTaxRegionSchema,
  DeleteTaxRegionsSchema,
} from "@danimai/tax";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateTaxRegionBodySchema = Type.Object({
  name: Type.Optional(Type.String()),
  tax_provider_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const taxRegionRoutes = new Elysia({ prefix: "/tax-regions" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedTaxRegionsProcess>(
        PAGINATED_TAX_REGIONS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedTaxRegionsSchema as any,
      detail: {
        tags: ["Tax Regions"],
        summary: "Get paginated tax regions",
        description: "Gets a paginated list of tax regions",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateTaxRegionsProcess>(CREATE_TAX_REGIONS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateTaxRegionsSchema as any,
      detail: {
        tags: ["Tax Regions"],
        summary: "Create tax region(s)",
        description: "Creates one or more tax regions",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateTaxRegionsProcess>(UPDATE_TAX_REGIONS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateTaxRegionBodySchema as any,
      detail: {
        tags: ["Tax Regions"],
        summary: "Update a tax region",
        description: "Updates an existing tax region by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteTaxRegionsProcess>(DELETE_TAX_REGIONS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteTaxRegionsSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Tax Regions"],
        summary: "Delete tax regions",
        description: "Deletes multiple tax regions by their IDs",
      },
    }
  );
