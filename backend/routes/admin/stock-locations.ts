import { Elysia } from "elysia";
import type { StaticDecode } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_STOCK_LOCATIONS_PROCESS,
  RETRIEVE_STOCK_LOCATION_PROCESS,
  CREATE_STOCK_LOCATION_PROCESS,
  UPDATE_STOCK_LOCATION_PROCESS,
  DELETE_STOCK_LOCATIONS_PROCESS,
  PaginatedStockLocationsProcess,
  RetrieveStockLocationProcess,
  CreateStockLocationProcess,
  UpdateStockLocationProcess,
  DeleteStockLocationsProcess,
  PaginatedStockLocationsSchema,
  PaginatedStockLocationsResponseSchema,
  RetrieveStockLocationSchema,
  StockLocationResponseSchema,
  CreateStockLocationSchema,
  CreateStockLocationResponseSchema,
  UpdateStockLocationSchema,
  UpdateStockLocationResponseSchema,
  DeleteStockLocationsSchema,
} from "@danimai/stock-location";

import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateStockLocationBodySchema = Type.Omit(UpdateStockLocationSchema, ["id"]);

export const stockLocationRoutes = new Elysia({ prefix: "/stock-locations" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedStockLocationsProcess>(
        PAGINATED_STOCK_LOCATIONS_PROCESS
      );
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedStockLocationsSchema>,
      });
    },
    {
      query: PaginatedStockLocationsSchema,
      response: {
        200: PaginatedStockLocationsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Stock Locations"],
        summary: "Get paginated stock locations",
        description: "Gets a paginated list of stock locations",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveStockLocationProcess>(RETRIEVE_STOCK_LOCATION_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: RetrieveStockLocationSchema.properties.id }),
      response: {
        200: StockLocationResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Stock Locations"],
        summary: "Retrieve stock location",
        description: "Retrieve a single stock location by id",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateStockLocationProcess>(CREATE_STOCK_LOCATION_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateStockLocationSchema,
      response: {
        200: CreateStockLocationResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Stock Locations"],
        summary: "Create stock location",
        description: "Creates a stock location",
        requestBody: {
          content: {
            "application/json": {
              example: {
                name: "Main Warehouse",
                address_id: null,
              },
            },
          },
        },
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateStockLocationProcess>(UPDATE_STOCK_LOCATION_PROCESS);
      const result = await process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
      return result;
    },
    {
      params: Type.Object({ id: UpdateStockLocationSchema.properties.id }),
      body: UpdateStockLocationBodySchema,
      response: {
        200: UpdateStockLocationResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Stock Locations"],
        summary: "Update a stock location",
        description: "Updates an existing stock location by id",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteStockLocationsProcess>(DELETE_STOCK_LOCATIONS_PROCESS);
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteStockLocationsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Stock Locations"],
        summary: "Delete stock locations",
        description: "Deletes stock locations by id",
      },
    }
  );
