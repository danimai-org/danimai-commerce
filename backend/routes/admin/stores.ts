import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
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
  PaginatedStoresResponseSchema,
  ListStoresSchema,
  ListStoresResponseSchema,
  ListAndCountStoresSchema,
  ListAndCountStoresResponseSchema,
  CreateStoresSchema,
  CreateStoresResponseSchema,
  UpdateStoreSchema,
  UpdateStoreResponseSchema,
  DeleteStoresSchema,
  StoreResponseSchema,
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
      return process.runOperations({ input });
    },
    {
      query: PaginatedStoresSchema,
      response: {
        200: PaginatedStoresResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      return process.runOperations({ input });
    },
    {
      query: ListStoresSchema,
      response: {
        200: ListStoresResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      const [data, count] = await process.runOperations({ input });
      return { data, count };
    },
    {
      query: ListAndCountStoresSchema,
      response: {
        200: ListAndCountStoresResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: StoreResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      return process.runOperations({ input });
    },
    {
      body: CreateStoresSchema,
      response: {
        200: CreateStoresResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateStoreBodySchema,
      response: {
        200: UpdateStoreResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteStoresSchema,
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
