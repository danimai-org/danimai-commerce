import { Elysia } from "elysia";
import { Type, type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_COLLECTION_PROCESS,
  UPDATE_COLLECTION_PROCESS,
  DELETE_COLLECTIONS_PROCESS,
  UPDATE_COLLECTION_PRODUCTS_PROCESS,
  PAGINATED_COLLECTIONS_PROCESS,
  CreateCollectionProcess,
  UpdateCollectionProcess,
  DeleteCollectionsProcess,
  UpdateCollectionProductsProcess,
  PaginatedCollectionsProcess,
  PaginatedCollectionsSchema,
  PaginatedCollectionsResponseSchema,
  RETRIEVE_COLLECTION_PROCESS,
  RetrieveCollectionProcess,
  RetrieveCollectionResponseSchema,
  CreateCollectionSchema,
  CreateCollectionResponseSchema,
  UpdateCollectionResponseSchema,
  DeleteCollectionsSchema,
  UpdateCollectionProductsBodySchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const collectionRoutes = new Elysia({ prefix: "/collections" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedCollectionsProcess>(PAGINATED_COLLECTIONS_PROCESS);
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedCollectionsSchema>
      });
    },
    {
      query: PaginatedCollectionsSchema,
      response: {
        200: PaginatedCollectionsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Collections"],
        summary: "Get paginated collections",
        description: "Gets a paginated list of product collections",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveCollectionProcess>(RETRIEVE_COLLECTION_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: RetrieveCollectionResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Collections"],
        summary: "Get a collection by ID",
        description: "Retrieves a single collection by its ID",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateCollectionProcess>(CREATE_COLLECTION_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateCollectionSchema,
      response: {
        200: CreateCollectionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Collections"],
        summary: "Create a new collection",
        description: "Creates a single collection with the provided details",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateCollectionProcess>(UPDATE_COLLECTION_PROCESS);
      return process.runOperations({
        input: { ...body, id: params.id },
      });
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: Type.Object({
        title: Type.Optional(Type.String()),
        handle: Type.Optional(Type.String()),
        metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
      }),
      response: {
        200: UpdateCollectionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Collections"],
        summary: "Update a collection",
        description: "Updates an existing collection by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteCollectionsProcess>(DELETE_COLLECTIONS_PROCESS);
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteCollectionsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Collections"],
        summary: "Delete collections",
        description: "Deletes multiple collections by their IDs",
      },
    }
  )
  .put(
    "/:id/products",
    async ({ params, body, set }) => {
      const process = getService<UpdateCollectionProductsProcess>(
        UPDATE_COLLECTION_PRODUCTS_PROCESS
      );
      await process.runOperations({
        input: { ...body, collection_id: params.id },
      });
      set.status = 204;
      return undefined;
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateCollectionProductsBodySchema,
      response: {
        204: NoContentResponseSchema,
        404: NotFoundResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Collections"],
        summary: "Update collection products",
        description: "Adds and removes products from a collection",
      },
    }
  );
