import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_REGIONS_PROCESS,
  CREATE_REGIONS_PROCESS,
  UPDATE_REGION_PROCESS,
  DELETE_REGIONS_PROCESS,
<<<<<<< HEAD
  LIST_COUNTRIES_PROCESS,
=======
  RETRIEVE_REGION_PROCESS,
>>>>>>> a274fd9c337c04b2fb2e046d4d44092f28a42c56
  PaginatedRegionsProcess,
  CreateRegionsProcess,
  UpdateRegionProcess,
  DeleteRegionsProcess,
<<<<<<< HEAD
  ListCountriesProcess,
=======
  RetrieveRegionProcess,
>>>>>>> a274fd9c337c04b2fb2e046d4d44092f28a42c56
  PaginatedRegionsSchema,
  PaginatedRegionsResponseSchema,
  CreateRegionSchema,
  CreateRegionResponseSchema,
  UpdateRegionSchema,
  UpdateRegionResponseSchema,
  DeleteRegionsSchema,
<<<<<<< HEAD
  ListCountriesResponseSchema,
=======
  RetrieveRegionSchema,
  RetrieveRegionResponseSchema,
>>>>>>> a274fd9c337c04b2fb2e046d4d44092f28a42c56
} from "@danimai/region";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";
import { StaticDecode } from "@sinclair/typebox";

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
      return process.runOperations({ input: input as StaticDecode<typeof PaginatedRegionsSchema> });
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
      body: CreateRegionSchema,
      response: {
        200: CreateRegionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Regions"],
        summary: "Create a region",
        description: "Creates a region",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveRegionProcess>(RETRIEVE_REGION_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: RetrieveRegionSchema.properties.id }),
      response: {
        200: RetrieveRegionResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Regions"],
        summary: "Retrieve a region",
        description: "Gets a region by ID",
      },
    }
  )
  .get(
    "/:id/countries",
    async ({ params }) => {
      const process = getService<ListCountriesProcess>(LIST_COUNTRIES_PROCESS);
      return process.runOperations({
        input: { region_id: params.id },
      });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: ListCountriesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Regions"],
        summary: "List countries in region",
        description: "Gets the list of countries assigned to a region",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateRegionProcess>(UPDATE_REGION_PROCESS);
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
