import { Elysia } from "elysia";
import { Type, type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_STORE_PROCESS,
  CreateStoreProcess,
  CreateStoreSchema,
  CreateStoreResponseSchema,
  RetrieveStoreProcess,
  RETRIEVE_STORE_PROCESS,
  RetrieveStoreSchema,
  RetrieveStoreResponseSchema,
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
    async ({ query: input }) => {
      const process = getService<RetrieveStoreProcess>(RETRIEVE_STORE_PROCESS);
      return process.runOperations({
        input: input as StaticDecode<typeof RetrieveStoreSchema>,
      });
    },
    {
      query: RetrieveStoreSchema,
      response: {
        200: RetrieveStoreResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Stores"],
        summary: "Retrieve store",
        description: "Retrieves a store by id",
      },
    },
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateStoreProcess>(CREATE_STORE_PROCESS);
      return process.runOperations({
        input: input as StaticDecode<typeof CreateStoreSchema>,
      });
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
        summary: "Create store",
        description: "Creates a store.",
      },
    },
  );
