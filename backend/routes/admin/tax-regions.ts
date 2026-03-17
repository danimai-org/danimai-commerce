import { Elysia } from "elysia";
import { StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_TAX_REGIONS_PROCESS,
  CREATE_TAX_REGION_PROCESS,
  UPDATE_TAX_REGIONS_PROCESS,
  DELETE_TAX_REGIONS_PROCESS,
  PaginatedTaxRegionsProcess,
  CreateTaxRegionProcess,
  UpdateTaxRegionsProcess,
  DeleteTaxRegionsProcess,
  PaginatedTaxRegionsSchema,
  PaginatedTaxRegionsResponseSchema,
  CreateTaxRegionSchema,
  CreateTaxRegionResponseSchema,
  UpdateTaxRegionSchema,
  UpdateTaxRegionResponseSchema,
  DeleteTaxRegionsSchema,
} from "@danimai/tax";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateTaxRegionBodySchema = Type.Omit(UpdateTaxRegionSchema, ["id"]);

export const taxRegionRoutes = new Elysia({ prefix: "/tax-regions" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedTaxRegionsProcess>(
        PAGINATED_TAX_REGIONS_PROCESS
      );
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedTaxRegionsSchema>,
      });
    },
    {
      query: PaginatedTaxRegionsSchema,
      response: {
        200: PaginatedTaxRegionsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Tax Regions"],
        summary: "Get paginated tax regions",
        description: "Gets a paginated list of tax regions",
      },
    }
  )
  .post(
    "/",
    async ({ body }: { body: StaticDecode<typeof CreateTaxRegionSchema> }) => {
      const process = getService<CreateTaxRegionProcess>(CREATE_TAX_REGION_PROCESS);
      return process.runOperations({ input: body });
    },
    {
      body: CreateTaxRegionSchema,
      response: {
        200: CreateTaxRegionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
    },
    {
      params: Type.Object({ id: UpdateTaxRegionSchema.properties.id }),
      body: UpdateTaxRegionBodySchema,
      response: {
        200: UpdateTaxRegionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteTaxRegionsSchema,
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
