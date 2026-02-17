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
  type CreateStockLocationsProcessInput,
  type UpdateStockLocationProcessInput,
  type DeleteStockLocationsProcessInput,
  type PaginatedStockLocationsProcessInput,
  PaginatedStockLocationsSchema,
  CreateStockLocationsSchema,
  UpdateStockLocationSchema,
  DeleteStockLocationsSchema,
} from "@danimai/stock-location";
import {
  CHECK_LOCATIONS_IN_USE_PROCESS,
  CheckLocationsInUseProcess,
} from "@danimai/inventory";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const stockLocationRoutes = new Elysia({ prefix: "/stock-locations" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedStockLocationsProcess>(
          PAGINATED_STOCK_LOCATIONS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(PaginatedStockLocationsSchema, query) as PaginatedStockLocationsProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["stock-locations"],
        summary: "Get paginated stock locations",
        description: "Gets a paginated list of stock locations",
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
        const process = getService<RetrieveStockLocationProcess>(RETRIEVE_STOCK_LOCATION_PROCESS);
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
        tags: ["stock-locations"],
        summary: "Retrieve stock location",
        description: "Retrieve a single stock location by id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<CreateStockLocationsProcess>(CREATE_STOCK_LOCATIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as CreateStockLocationsProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["stock-locations"],
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
    async ({ params, body, set }) => {
      try {
        const process = getService<UpdateStockLocationsProcess>(UPDATE_STOCK_LOCATIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateStockLocationProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["stock-locations"],
        summary: "Update a stock location",
        description: "Updates an existing stock location by id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              example: {
                name: "Updated Warehouse Name",
                address_id: null,
              },
            },
          },
        },
      },
    }
  )
  .delete(
    "/",
    async ({ body, set }) => {
      try {
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteStockLocationsProcessInput;
        const checkProcess = getService<CheckLocationsInUseProcess>(CHECK_LOCATIONS_IN_USE_PROCESS);
        await checkProcess.runOperations({
          input: { location_ids: input.stock_location_ids },
          logger,
        });
        const process = getService<DeleteStockLocationsProcess>(DELETE_STOCK_LOCATIONS_PROCESS);
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["stock-locations"],
        summary: "Delete stock locations",
        description: "Soft-deletes multiple stock locations by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: { stock_location_ids: ["550e8400-e29b-41d4-a716-446655440000"] },
            },
          },
        },
      },
    }
  );
