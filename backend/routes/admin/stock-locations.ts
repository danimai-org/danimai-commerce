import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_STOCK_LOCATIONS_PROCESS,
  RETRIEVE_STOCK_LOCATION_PROCESS,
  CREATE_STOCK_LOCATIONS_PROCESS,
  UPDATE_STOCK_LOCATIONS_PROCESS,
  DELETE_STOCK_LOCATIONS_PROCESS,
  PaginatedStockLocationsProcess,
  RetrieveStockLocationProcess,
  CreateStockLocationsProcess,
  UpdateStockLocationsProcess,
  DeleteStockLocationsProcess,
  PaginatedStockLocationsSchema,
  CreateStockLocationsSchema,
  DeleteStockLocationsSchema,
} from "@danimai/stock-location";
import {
  CHECK_LOCATIONS_IN_USE_PROCESS,
  CheckLocationsInUseProcess,
} from "@danimai/inventory";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";
import { Type } from "@sinclair/typebox";

const UpdateStockLocationBodySchema = Type.Object({
  name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  address_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]))),
});

export const stockLocationRoutes = new Elysia({ prefix: "/stock-locations" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedStockLocationsProcess>(
        PAGINATED_STOCK_LOCATIONS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedStockLocationsSchema as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
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
      const process = getService<CreateStockLocationsProcess>(CREATE_STOCK_LOCATIONS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateStockLocationsSchema as any,
      detail: {
        tags: ["Stock Locations"],
        summary: "Create stock location(s)",
        description: "Creates one or more stock locations",
        requestBody: {
          content: {
            "application/json": {
              example: {
                stock_locations: [
                  {
                    name: "Main Warehouse",
                    address_id: null,
                  },
                ],
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
      const process = getService<UpdateStockLocationsProcess>(UPDATE_STOCK_LOCATIONS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateStockLocationBodySchema as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const checkProcess = getService<CheckLocationsInUseProcess>(CHECK_LOCATIONS_IN_USE_PROCESS);
      const { stock_location_ids } = input as { stock_location_ids: string[] };
      await checkProcess.runOperations({
        input: { location_ids: stock_location_ids },
        logger,
      } as any);
      const process = getService<DeleteStockLocationsProcess>(DELETE_STOCK_LOCATIONS_PROCESS);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteStockLocationsSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Stock Locations"],
        summary: "Delete stock locations",
        description: "Soft-deletes multiple stock locations by their IDs",
      },
    }
  );
