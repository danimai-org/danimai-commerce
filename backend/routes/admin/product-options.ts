import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCT_OPTIONS_PROCESS,
  UPDATE_PRODUCT_OPTIONS_PROCESS,
  DELETE_PRODUCT_OPTIONS_PROCESS,
  PAGINATED_PRODUCT_OPTIONS_PROCESS,
  CreateProductOptionsProcess,
  UpdateProductOptionsProcess,
  DeleteProductOptionsProcess,
  PaginatedProductOptionsProcess,
  type CreateProductOptionProcessInput,
  type UpdateProductOptionProcessInput,
  type DeleteProductOptionsProcessInput,
  type PaginatedProductOptionsProcessInput,
  PaginatedProductOptionsSchema,
  RETRIEVE_PRODUCT_OPTION_PROCESS,
  RetrieveProductOptionProcess,
  type RetrieveProductOptionProcessInput,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import Value from "typebox/value";

export const productOptionRoutes = new Elysia({ prefix: "/product-options" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedProductOptionsProcess>(PAGINATED_PRODUCT_OPTIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: Value.Convert(PaginatedProductOptionsSchema, query) as PaginatedProductOptionsProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-options"],
        summary: "Get paginated product options",
        description: "Gets a paginated list of product options",
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
        const process = getService<RetrieveProductOptionProcess>(RETRIEVE_PRODUCT_OPTION_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: { id: params.id } as RetrieveProductOptionProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-options"],
        summary: "Get a product option by ID",
        description: "Retrieves a single product option by its ID",
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
        const process = getService<CreateProductOptionsProcess>(CREATE_PRODUCT_OPTIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: body as CreateProductOptionProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-options"],
        summary: "Create a new product option",
        description: "Creates a single product option with the provided details",
        requestBody: {
          content: {
            "application/json": {
              example: {
                title: "Size",
                product_id: "550e8400-e29b-41d4-a716-446655440000",
                metadata: {
                  type: "size",
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
        const process = getService<UpdateProductOptionsProcess>(UPDATE_PRODUCT_OPTIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateProductOptionProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-options"],
        summary: "Update a product option",
        description: "Updates an existing product option by ID",
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
                title: "Updated Option Title",
                product_id: "660e8400-e29b-41d4-a716-446655440001",
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
        const process = getService<DeleteProductOptionsProcess>(DELETE_PRODUCT_OPTIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteProductOptionsProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-options"],
        summary: "Delete product options",
        description: "Deletes multiple product options by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: {
                option_ids: [
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
