import { Elysia } from "elysia";
import { Type, type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_STORES_PROCESS,
  RETRIEVE_STORE_PROCESS,
  PaginatedStoresProcess,
  RetrieveStoreProcess,
  PaginatedStoresSchema,
  PaginatedStoresResponseSchema,
  RetrieveStoreSchema,
  RetrieveStoreResponseSchema,
  CREATE_STORE_PROCESS,
  CreateStoreProcess,
  CreateStoreSchema,
  CreateStoreResponseSchema,
} from "@danimai/store";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const storeRoutes = new Elysia({ prefix: "/stores" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedStoresProcess>(PAGINATED_STORES_PROCESS);
      const input = query as unknown as StaticDecode<typeof PaginatedStoresSchema>;
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
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveStoreProcess>(RETRIEVE_STORE_PROCESS);
      return process.runOperations({ input: {} as StaticDecode<typeof RetrieveStoreSchema> });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: RetrieveStoreResponseSchema,
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
      const process = getService<CreateStoreProcess>(CREATE_STORE_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateStoreSchema,
      response: {
        200: CreateStoreResponseSchema,
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
  ;
