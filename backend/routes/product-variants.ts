import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCT_VARIANTS_PROCESS,
  UPDATE_PRODUCT_VARIANTS_PROCESS,
  DELETE_PRODUCT_VARIANTS_PROCESS,
  PAGINATED_PRODUCT_VARIANTS_PROCESS,
  CreateProductVariantsProcess,
  UpdateProductVariantsProcess,
  DeleteProductVariantsProcess,
  PaginatedProductVariantsProcess,
  type CreateProductVariantProcessInput,
  type UpdateProductVariantProcessInput,
  type DeleteProductVariantsProcessInput,
  type PaginatedProductVariantsProcessInput,
  PaginatedProductVariantsSchema,
  RETRIEVE_PRODUCT_VARIANT_PROCESS,
  RetrieveProductVariantProcess,
  type RetrieveProductVariantProcessInput,
} from "@danimai/product";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const productVariantRoutes = new Elysia({ prefix: "/product-variants" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedProductVariantsProcess>(PAGINATED_PRODUCT_VARIANTS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: Value.Convert(PaginatedProductVariantsSchema, query) as PaginatedProductVariantsProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-variants"],
        summary: "Get paginated product variants",
        description: "Gets a paginated list of product variants",
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
        const process = getService<RetrieveProductVariantProcess>(RETRIEVE_PRODUCT_VARIANT_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: { id: params.id } as RetrieveProductVariantProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-variants"],
        summary: "Get a product variant by ID",
        description: "Retrieves a single product variant by its ID",
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
        const process = getService<CreateProductVariantsProcess>(CREATE_PRODUCT_VARIANTS_PROCESS);
        const result = await process.runOperations({ input: body as CreateProductVariantProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-variants"],
        summary: "Create a new product variant",
        description: "Creates a single product variant with the provided details",
        requestBody: {
          content: {
            "application/json": {
              example: {
                title: "Small / Red",
                product_id: "550e8400-e29b-41d4-a716-446655440000",
                sku: "TSHIRT-S-RED",
                barcode: "1234567890123",
                allow_backorder: false,
                manage_inventory: true,
                variant_rank: 1,
                thumbnail: "https://example.com/images/variant.jpg",
                metadata: {
                  size: "S",
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
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const process = getService<UpdateProductVariantsProcess>(UPDATE_PRODUCT_VARIANTS_PROCESS);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateProductVariantProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-variants"],
        summary: "Update a product variant",
        description: "Updates an existing product variant by ID",
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
                title: "Updated Variant Title",
                sku: "UPDATED-SKU",
                allow_backorder: true,
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
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const process = getService<DeleteProductVariantsProcess>(DELETE_PRODUCT_VARIANTS_PROCESS);
        const input = body as unknown as DeleteProductVariantsProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-variants"],
        summary: "Delete product variants",
        description: "Deletes multiple product variants by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: {
                variant_ids: [
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
