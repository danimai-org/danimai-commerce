import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
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
  PaginatedStoresSchema,
  ListStoresSchema,
  ListAndCountStoresSchema,
  CreateStoresSchema,
  UpdateStoreSchema,
  DeleteStoresSchema,
} from "@danimai/store";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateStoreBodySchema = Type.Object({
  name: Type.Optional(Type.String()),
  default_currency_code: Type.Optional(Type.String()),
  default_sales_channel_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  default_region_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  default_location_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const storeRoutes = new Elysia({ prefix: "/stores" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedStoresProcess>(PAGINATED_STORES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedStoresSchema as any,
      detail: {
        tags: ["Stores"],
        summary: "Get paginated stores",
        description: "Gets a paginated list of stores",
      },
    }
  )
  .get(
    "/list",
    async ({ query: input }) => {
      const process = getService<ListStoresProcess>(LIST_STORES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: ListStoresSchema as any,
      detail: {
        tags: ["Stores"],
        summary: "List stores",
        description: "List stores with optional filters (name, limit, offset)",
      },
    }
  )
  .get(
    "/list-and-count",
    async ({ query: input }) => {
      const process = getService<ListAndCountStoresProcess>(
        LIST_AND_COUNT_STORES_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const [data, count] = await process.runOperations({ input, logger } as any);
      return { data, count };
    },
    {
      query: ListAndCountStoresSchema as any,
      detail: {
        tags: ["Stores"],
        summary: "List and count stores",
        description: "Returns { data, count }",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveStoreProcess>(RETRIEVE_STORE_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      detail: {
        tags: ["Stores"],
        summary: "Retrieve store",
        description: "Retrieve a single store by id",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateStoresProcess>(CREATE_STORES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateStoresSchema as any,
      detail: {
        tags: ["Stores"],
        summary: "Create store(s)",
        description: "Creates one or more stores. Danimai-style createStores.",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateStoresProcess>(UPDATE_STORES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateStoreBodySchema as any,
      detail: {
        tags: ["Stores"],
        summary: "Update a store",
        description: "Updates an existing store by id",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteStoresProcess>(DELETE_STORES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteStoresSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Stores"],
        summary: "Delete stores",
        description: "Soft-deletes multiple stores by their IDs. Danimai-style deleteStores.",
      },
    }
  );
