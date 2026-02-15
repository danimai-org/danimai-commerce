import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCT_CATEGORIES_PROCESS,
  UPDATE_PRODUCT_CATEGORIES_PROCESS,
  DELETE_PRODUCT_CATEGORIES_PROCESS,
  BATCH_LINK_PRODUCTS_TO_CATEGORY_PROCESS,
  CreateProductCategoriesProcess,
  UpdateProductCategoriesProcess,
  DeleteProductCategoriesProcess,
  BatchLinkProductsToCategoryProcess,
  type CreateProductCategoryProcessInput,
  type UpdateProductCategoryProcessInput,
  type DeleteProductCategoriesProcessInput,
  type BatchLinkProductsToCategoryProcessInput,
  PAGINATED_PRODUCT_CATEGORIES_PROCESS,
  PaginatedProductCategoriesProcess,
  type PaginatedProductCategoriesProcessInput,
  PaginatedProductCategoriesSchema,
  RETRIEVE_PRODUCT_CATEGORY_PROCESS,
  RetrieveProductCategoryProcess,
  type RetrieveProductCategoryProcessInput,
} from "@danimai/product";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const productCategoryRoutes = new Elysia({ prefix: "/product-categories" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedProductCategoriesProcess>(PAGINATED_PRODUCT_CATEGORIES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: Value.Convert(PaginatedProductCategoriesSchema, query) as PaginatedProductCategoriesProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-categories"],
        summary: "Get paginated product categories",
        description: "Gets a paginated list of product categories",
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
        const process = getService<RetrieveProductCategoryProcess>(RETRIEVE_PRODUCT_CATEGORY_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: { id: params.id } as RetrieveProductCategoryProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-categories"],
        summary: "Get a product category by ID",
        description: "Retrieves a single product category by its ID",
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
        const process = getService<CreateProductCategoriesProcess>(CREATE_PRODUCT_CATEGORIES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: body as CreateProductCategoryProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-categories"],
        summary: "Create a new product category",
        description: "Creates a single product category with the provided details",
        requestBody: {
          content: {
            "application/json": {
              example: {
                value: "Electronics",
                parent_id: "550e8400-e29b-41d4-a716-446655440000",
                status: "active",
                visibility: "public",
                metadata: {
                  level: 2,
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
        const process = getService<UpdateProductCategoriesProcess>(UPDATE_PRODUCT_CATEGORIES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateProductCategoryProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-categories"],
        summary: "Update a product category",
        description: "Updates an existing product category by ID",
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
                value: "Updated Category Name",
                parent_id: "660e8400-e29b-41d4-a716-446655440001",
                status: "active",
                visibility: "public",
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
        const process = getService<DeleteProductCategoriesProcess>(DELETE_PRODUCT_CATEGORIES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteProductCategoriesProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-categories"],
        summary: "Delete product categories",
        description: "Deletes multiple product categories by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: {
                category_ids: [
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
        const process = getService<BatchLinkProductsToCategoryProcess>(
          BATCH_LINK_PRODUCTS_TO_CATEGORY_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        await process.runOperations({
          input: { ...(body as Omit<BatchLinkProductsToCategoryProcessInput, "category_id">), category_id: params.id },
          logger,
        });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-categories"],
        summary: "Link products to category",
        description: "Links multiple products to a product category in a batch operation",
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
