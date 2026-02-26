import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService, PaginationSchema } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_COLLECTIONS_PROCESS,
  UPDATE_COLLECTIONS_PROCESS,
  DELETE_COLLECTIONS_PROCESS,
  BATCH_LINK_PRODUCTS_TO_COLLECTION_PROCESS,
  BATCH_REMOVE_PRODUCTS_FROM_COLLECTION_PROCESS,
  PAGINATED_COLLECTIONS_PROCESS,
  PAGINATED_PRODUCTS_BY_COLLECTION_PROCESS,
  CreateCollectionsProcess,
  UpdateCollectionsProcess,
  DeleteCollectionsProcess,
  BatchLinkProductsToCollectionProcess,
  BatchRemoveProductsFromCollectionProcess,
  PaginatedCollectionsProcess,
  PaginatedProductsByCollectionProcess,
  type PaginatedCollectionsProcessInput,
  type PaginatedProductsByCollectionProcessInput,
  PaginatedCollectionsSchema,
  PaginatedCollectionsResponseSchema,
  PaginatedProductsByCollectionResponseSchema,
  RETRIEVE_COLLECTION_PROCESS,
  RetrieveCollectionProcess,
  RetrieveCollectionSchema,
  RetrieveCollectionResponseSchema,
  CreateCollectionSchema,
  CreateCollectionsResponseSchema,
  UpdateCollectionsResponseSchema,
  DeleteCollectionsSchema,
} from "@danimai/product";
import {
  LIST_SALES_CHANNELS_BY_IDS_PROCESS,
  ListSalesChannelsByIdsProcess,
} from "@danimai/sales-channel";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const BatchLinkBodySchema = Type.Object({
  product_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});
const BatchRemoveBodySchema = Type.Object({
  product_ids: Type.Array(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export const collectionRoutes = new Elysia({ prefix: "/collections" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedCollectionsProcess>(PAGINATED_COLLECTIONS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const cleanedQuery: Record<string, unknown> = { ...query };
      if (typeof cleanedQuery.sales_channel_ids === "string") {
        cleanedQuery.sales_channel_ids = (cleanedQuery.sales_channel_ids as string).split(",").map((s) => s.trim()).filter(Boolean);
      }
      const input = cleanedQuery as PaginatedCollectionsProcessInput;
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedCollectionsSchema as any,
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
    "/:id/products",
    async ({ params, query }) => {
      const process = getService<PaginatedProductsByCollectionProcess>(PAGINATED_PRODUCTS_BY_COLLECTION_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input: PaginatedProductsByCollectionProcessInput = { collection_id: params.id, ...query };
      const result = await process.runOperations({ input, logger } as any);
      const allScIds = [...new Set(result.products.flatMap((p) => p.sales_channel_ids))];
      let scMap: Record<string, { id: string; name: string; description: string | null; is_default: boolean; metadata: unknown; created_at: string; updated_at: string; deleted_at: string | null }> = {};
      if (allScIds.length > 0) {
        const listProcess = getService<ListSalesChannelsByIdsProcess>(LIST_SALES_CHANNELS_BY_IDS_PROCESS);
        const channels = await listProcess.runOperations({ input: { ids: allScIds }, logger } as any);
        scMap = Object.fromEntries(channels.map((c) => [c.id, c]));
      }
      const products = result.products.map((p) => {
        const { sales_channel_ids, ...rest } = p;
        const sales_channels = sales_channel_ids.map((id) => scMap[id]).filter(Boolean);
        return { ...rest, sales_channels };
      });
      return { products, count: result.count, offset: result.offset, limit: result.limit };
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      query: PaginationSchema as any,
      response: {
        200: PaginatedProductsByCollectionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Collections"],
        summary: "Get products in collection",
        description: "Gets a paginated list of products in a collection",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveCollectionProcess>(RETRIEVE_COLLECTION_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: RetrieveCollectionSchema as any,
      response: {
        200: RetrieveCollectionResponseSchema,
        400: ValidationErrorResponseSchema,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const process = getService<CreateCollectionsProcess>(CREATE_COLLECTIONS_PROCESS);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateCollectionSchema as any,
      response: {
        200: CreateCollectionsResponseSchema,
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
      const process = getService<UpdateCollectionsProcess>(UPDATE_COLLECTIONS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: Type.Object({
        title: Type.Optional(Type.String()),
        handle: Type.Optional(Type.String()),
        metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
      }) as any,
      response: {
        200: UpdateCollectionsResponseSchema,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteCollectionsSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Collections"],
        summary: "Delete collections",
        description: "Deletes multiple collections by their IDs",
      },
    }
  )
  .post(
    "/:id/products",
    async ({ params, body, set }) => {
      const process = getService<BatchLinkProductsToCollectionProcess>(
        BATCH_LINK_PRODUCTS_TO_COLLECTION_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({
        input: { ...(body as Record<string, unknown>), collection_id: params.id },
        logger,
      } as any);
      set.status = 204;
      return undefined;
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: BatchLinkBodySchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Collections"],
        summary: "Link products to collection",
        description: "Links multiple products to a collection in a batch operation",
      },
    }
  )
  .delete(
    "/:id/products",
    async ({ params, body, set }) => {
      const process = getService<BatchRemoveProductsFromCollectionProcess>(
        BATCH_REMOVE_PRODUCTS_FROM_COLLECTION_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({
        input: { ...(body as Record<string, unknown>), collection_id: params.id },
        logger,
      } as any);
      set.status = 204;
      return undefined;
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: BatchRemoveBodySchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Collections"],
        summary: "Remove products from collection",
        description: "Removes the association between products and the collection",
      },
    }
  );
