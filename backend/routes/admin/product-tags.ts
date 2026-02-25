import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCT_TAGS_PROCESS,
  UPDATE_PRODUCT_TAGS_PROCESS,
  DELETE_PRODUCT_TAGS_PROCESS,
  PAGINATED_PRODUCT_TAGS_PROCESS,
  PAGINATED_PRODUCTS_BY_TAG_PROCESS,
  CreateProductTagsProcess,
  UpdateProductTagsProcess,
  DeleteProductTagsProcess,
  PaginatedProductTagsProcess,
  PaginatedProductsByTagProcess,
  type CreateProductTagProcessInput,
  type UpdateProductTagProcessInput,
  type DeleteProductTagsProcessInput,
  type PaginatedProductTagsProcessInput,
  type PaginatedProductsByTagProcessInput,
  PaginatedProductTagsSchema,
  PaginatedProductsByTagSchema,
  RETRIEVE_PRODUCT_TAG_PROCESS,
  RetrieveProductTagProcess,
  type RetrieveProductTagProcessInput,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import Value from "typebox/value";

export const productTagRoutes = new Elysia({ prefix: "/product-tags" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedProductTagsProcess>(PAGINATED_PRODUCT_TAGS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: Value.Convert(PaginatedProductTagsSchema, query) as PaginatedProductTagsProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-tags"],
        summary: "Get paginated product tags",
        description: "Gets a paginated list of product tags",
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
    "/:id",
    async ({ params, set }) => {
      try {
        const process = getService<RetrieveProductTagProcess>(RETRIEVE_PRODUCT_TAG_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: { id: params.id } as RetrieveProductTagProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-tags"],
        summary: "Get a product tag by ID",
        description: "Retrieves a single product tag by its ID",
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
  .get(
    "/:id/products",
    async ({ params, query, set }) => {
      try {
        const process = getService<PaginatedProductsByTagProcess>(PAGINATED_PRODUCTS_BY_TAG_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(PaginatedProductsByTagSchema, { tag_id: params.id, ...query }) as PaginatedProductsByTagProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-tags"],
        summary: "Get products by tag",
        description: "Gets a paginated list of products that have this tag",
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
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<CreateProductTagsProcess>(CREATE_PRODUCT_TAGS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: body as CreateProductTagProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-tags"],
        summary: "Create a new product tag",
        description: "Creates a single product tag with the provided details",
        requestBody: {
          content: {
            "application/json": {
              example: {
                value: "sale",
                metadata: {
                  color: "red",
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
        const process = getService<UpdateProductTagsProcess>(UPDATE_PRODUCT_TAGS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateProductTagProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-tags"],
        summary: "Update a product tag",
        description: "Updates an existing product tag by ID",
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
                value: "updated-tag",
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
        const process = getService<DeleteProductTagsProcess>(DELETE_PRODUCT_TAGS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteProductTagsProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-tags"],
        summary: "Delete product tags",
        description: "Deletes multiple product tags by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: {
                tag_ids: [
                  "550e8400-e29b-41d4-a716-446655440000",
                  "660e8400-e29b-41d4-a716-446655440001",
                ],
              },
            },
          },
        },
      },
    }
  );
