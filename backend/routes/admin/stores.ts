import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_STORES_PROCESS,
  LIST_STORES_PROCESS,
  LIST_AND_COUNT_STORES_PROCESS,
  RETRIEVE_STORE_PROCESS,
  CREATE_STORES_PROCESS,
  UPDATE_STORES_PROCESS,
  DELETE_STORES_PROCESS,
  PaginatedStoresProcess,
  ListStoresProcess,
  ListAndCountStoresProcess,
  RetrieveStoreProcess,
  CreateStoresProcess,
  UpdateStoresProcess,
  DeleteStoresProcess,
  type CreateStoresProcessInput,
  type UpdateStoreProcessInput,
  type DeleteStoresProcessInput,
  type PaginatedStoresProcessInput,
  type ListStoresProcessInput,
  type ListAndCountStoresProcessInput,
  PaginatedStoresSchema,
  ListStoresSchema,
  ListAndCountStoresSchema,
  CreateStoresSchema,
  UpdateStoreSchema,
  DeleteStoresSchema,
} from "@danimai/store";
import { handleProcessError } from "../../utils/error-handler";
import Value from "typebox/value";

export const storeRoutes = new Elysia({ prefix: "/stores" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedStoresProcess>(
          PAGINATED_STORES_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(PaginatedStoresSchema, query) as PaginatedStoresProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["stores"],
        summary: "Get paginated stores",
        description: "Gets a paginated list of stores",
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
    "/list",
    async ({ query, set }) => {
      try {
        const process = getService<ListStoresProcess>(LIST_STORES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(ListStoresSchema, query) as ListStoresProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["stores"],
        summary: "List stores",
        description: "List stores with optional filters (name, limit, offset)",
        parameters: [
          { name: "name", in: "query", required: false, schema: { type: "string" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "offset", in: "query", required: false, schema: { type: "number" } },
        ],
      },
    }
  )
  .get(
    "/list-and-count",
    async ({ query, set }) => {
      try {
        const process = getService<ListAndCountStoresProcess>(
          LIST_AND_COUNT_STORES_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const [data, count] = await process.runOperations({
          input: Value.Convert(ListAndCountStoresSchema, query) as ListAndCountStoresProcessInput,
          logger,
        });
        return { data, count };
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["stores"],
        summary: "List and count stores",
        description: "Returns { data, count }",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
          { name: "name", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const process = getService<RetrieveStoreProcess>(RETRIEVE_STORE_PROCESS);
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
        tags: ["stores"],
        summary: "Retrieve store",
        description: "Retrieve a single store by id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<CreateStoresProcess>(CREATE_STORES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as CreateStoresProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["stores"],
        summary: "Create store(s)",
        description: "Creates one or more stores. Danimai-style createStores.",
        requestBody: {
          content: {
            "application/json": {
              example: {
                stores: [
                  {
                    name: "My Store",
                    default_currency_code: "eur",
                    default_sales_channel_id: null,
                    default_region_id: null,
                    default_location_id: null,
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
        const process = getService<UpdateStoresProcess>(UPDATE_STORES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateStoreProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["stores"],
        summary: "Update a store",
        description: "Updates an existing store by id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              example: {
                name: "Updated Store Name",
                default_currency_code: "usd",
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
        const process = getService<DeleteStoresProcess>(DELETE_STORES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteStoresProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["stores"],
        summary: "Delete stores",
        description: "Soft-deletes multiple stores by their IDs. Danimai-style deleteStores.",
        requestBody: {
          content: {
            "application/json": {
              example: { store_ids: ["550e8400-e29b-41d4-a716-446655440000"] },
            },
          },
        },
      },
    }
  );
