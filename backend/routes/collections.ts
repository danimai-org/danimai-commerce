import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
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
  type CreateCollectionProcessInput,
  type UpdateCollectionProcessInput,
  type DeleteCollectionsProcessInput,
  type BatchLinkProductsToCollectionProcessInput,
  type BatchRemoveProductsFromCollectionProcessInput,
  type PaginatedCollectionsProcessInput,
  type PaginatedProductsByCollectionProcessInput,
  PaginatedCollectionsSchema,
  PaginatedProductsByCollectionSchema,
  RETRIEVE_COLLECTION_PROCESS,
  RetrieveCollectionProcess,
  type RetrieveCollectionProcessInput,
} from "@danimai/product";
import {
  LIST_SALES_CHANNELS_BY_IDS_PROCESS,
  ListSalesChannelsByIdsProcess,
} from "@danimai/sales-channel";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const collectionRoutes = new Elysia({ prefix: "/collections" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedCollectionsProcess>(PAGINATED_COLLECTIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const cleanedQuery: Record<string, unknown> = { ...query };
        if (typeof cleanedQuery.sales_channel_ids === "string") {
          cleanedQuery.sales_channel_ids = (cleanedQuery.sales_channel_ids as string).split(",").map((s) => s.trim()).filter(Boolean);
        }
        const result = await process.runOperations({ input: Value.Convert(PaginatedCollectionsSchema, cleanedQuery) as PaginatedCollectionsProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["collections"],
        summary: "Get paginated collections",
        description: "Gets a paginated list of product collections",
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "number" },
            example: 1,
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "number" },
            example: 10,
          },
          {
            name: "sorting_field",
            in: "query",
            required: false,
            schema: { type: "string" },
            example: "created_at",
          },
          {
            name: "sorting_direction",
            in: "query",
            required: false,
            schema: { type: "string" },
            example: "desc",
          },
        ],
      },
    }
  )
  .get(
    "/:id/products",
    async ({ params, query, set }) => {
      try {
        const process = getService<PaginatedProductsByCollectionProcess>(PAGINATED_PRODUCTS_BY_COLLECTION_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(PaginatedProductsByCollectionSchema, { collection_id: params.id, ...query }) as PaginatedProductsByCollectionProcessInput;
        const result = await process.runOperations({ input, logger });
        const allScIds = [...new Set(result.products.flatMap((p) => p.sales_channel_ids))];
        let scMap: Record<string, { id: string; name: string; description: string | null; is_default: boolean; metadata: unknown; created_at: string; updated_at: string; deleted_at: string | null }> = {};
        if (allScIds.length > 0) {
          const listProcess = getService<ListSalesChannelsByIdsProcess>(LIST_SALES_CHANNELS_BY_IDS_PROCESS);
          const channels = await listProcess.runOperations({ input: { ids: allScIds }, logger });
          scMap = Object.fromEntries(channels.map((c) => [c.id, c]));
        }
        const products = result.products.map((p) => {
          const { sales_channel_ids, ...rest } = p;
          const sales_channels = sales_channel_ids.map((id) => scMap[id]).filter(Boolean);
          return { ...rest, sales_channels };
        });
        return { products, count: result.count, offset: result.offset, limit: result.limit };
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["collections"],
        summary: "Get products in collection",
        description: "Gets a paginated list of products in a collection",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
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
        const process = getService<RetrieveCollectionProcess>(RETRIEVE_COLLECTION_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: { id: params.id } as RetrieveCollectionProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["collections"],
        summary: "Get a collection by ID",
        description: "Retrieves a single collection by its ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
        ],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const process = getService<CreateCollectionsProcess>(CREATE_COLLECTIONS_PROCESS);
        const result = await process.runOperations({ input: body as CreateCollectionProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["collections"],
        summary: "Create a new collection",
        description: "Creates a single collection with the provided details",
        requestBody: {
          content: {
            "application/json": {
              example: {
                title: "Summer Collection",
                handle: "summer-collection",
                metadata: {
                  season: "summer",
                  year: "2024",
                },
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
        const process = getService<UpdateCollectionsProcess>(UPDATE_COLLECTIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateCollectionProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["collections"],
        summary: "Update a collection",
        description: "Updates an existing collection by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              example: {
                title: "Updated Collection Title",
                handle: "updated-collection-handle",
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
        const process = getService<DeleteCollectionsProcess>(DELETE_COLLECTIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteCollectionsProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["collections"],
        summary: "Delete collections",
        description: "Deletes multiple collections by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: {
                collection_ids: [
                  "550e8400-e29b-41d4-a716-446655440000",
                  "660e8400-e29b-41d4-a716-446655440001",
                ],
              },
            },
          },
        },
      },
    }
  )
  .post(
    "/:id/products",
    async ({ params, body, set }) => {
      try {
        const process = getService<BatchLinkProductsToCollectionProcess>(
          BATCH_LINK_PRODUCTS_TO_COLLECTION_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        await process.runOperations({
          input: { ...(body as Omit<BatchLinkProductsToCollectionProcessInput, "collection_id">), collection_id: params.id },
          logger,
        });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["collections"],
        summary: "Link products to collection",
        description: "Links multiple products to a collection in a batch operation",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              example: {
                product_ids: [
                  "770e8400-e29b-41d4-a716-446655440002",
                  "880e8400-e29b-41d4-a716-446655440003",
                ],
              },
            },
          },
        },
      },
    }
  )
  .delete(
    "/:id/products",
    async ({ params, body, set }) => {
      try {
        const process = getService<BatchRemoveProductsFromCollectionProcess>(
          BATCH_REMOVE_PRODUCTS_FROM_COLLECTION_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        await process.runOperations({
          input: { ...(body as Omit<BatchRemoveProductsFromCollectionProcessInput, "collection_id">), collection_id: params.id },
          logger,
        });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["collections"],
        summary: "Remove products from collection",
        description: "Removes the association between products and the collection",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              example: {
                product_ids: [
                  "770e8400-e29b-41d4-a716-446655440002",
                  "880e8400-e29b-41d4-a716-446655440003",
                ],
              },
            },
          },
        },
      },
    }
  );
