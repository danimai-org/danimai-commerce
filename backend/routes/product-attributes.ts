import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCT_ATTRIBUTES_PROCESS,
  UPDATE_PRODUCT_ATTRIBUTES_PROCESS,
  DELETE_PRODUCT_ATTRIBUTES_PROCESS,
  PAGINATED_PRODUCT_ATTRIBUTES_PROCESS,
  RETRIEVE_PRODUCT_ATTRIBUTE_PROCESS,
  PAGINATED_PRODUCTS_BY_ATTRIBUTE_PROCESS,
  CreateProductAttributesProcess,
  UpdateProductAttributesProcess,
  DeleteProductAttributesProcess,
  PaginatedProductAttributesProcess,
  RetrieveProductAttributeProcess,
  PaginatedProductsByAttributeProcess,
  type CreateProductAttributeProcessInput,
  type UpdateProductAttributeProcessInput,
  type DeleteProductAttributesProcessInput,
  type PaginatedProductAttributesProcessInput,
  type RetrieveProductAttributeProcessInput,
  type PaginatedProductsByAttributeProcessInput,
  PaginatedProductAttributesSchema,
  PaginatedProductsByAttributeSchema,
} from "@danimai/product";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

const productAttributesListHandler = async ({ query, set }: { query: Record<string, string>; set: any }) => {
  try {
    const process = getService<PaginatedProductAttributesProcess>(PAGINATED_PRODUCT_ATTRIBUTES_PROCESS);
    const logger = getService<Logger>(DANIMAI_LOGGER);
    const result = await process.runOperations({
      input: Value.Convert(PaginatedProductAttributesSchema, query) as PaginatedProductAttributesProcessInput,
      logger,
    });
    return result;
  } catch (err) {
    return handleProcessError(err, set);
  }
};

export const productAttributeRoutes = new Elysia({ prefix: "/product-attributes" })
  .get(
    "/",
    productAttributesListHandler,
    {
      detail: {
        tags: ["product-attributes"],
        summary: "Get paginated product attributes",
        description: "Gets a paginated list of product attributes",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" }, example: 1 },
          { name: "limit", in: "query", required: false, schema: { type: "number" }, example: 10 },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" }, example: "created_at" },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" }, example: "desc" },
        ],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const process = getService<RetrieveProductAttributeProcess>(RETRIEVE_PRODUCT_ATTRIBUTE_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { id: params.id } as RetrieveProductAttributeProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-attributes"],
        summary: "Get a product attribute by ID",
        description: "Retrieves a single product attribute by its ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
      },
    }
  )
  .get(
    "/:id/products",
    async ({ params, query, set }) => {
      try {
        const process = getService<PaginatedProductsByAttributeProcess>(PAGINATED_PRODUCTS_BY_ATTRIBUTE_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(PaginatedProductsByAttributeSchema, { attribute_id: params.id, ...query }) as PaginatedProductsByAttributeProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-attributes"],
        summary: "Get products by attribute",
        description: "Gets a paginated list of products that have this attribute",
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
        const process = getService<CreateProductAttributesProcess>(CREATE_PRODUCT_ATTRIBUTES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: body as CreateProductAttributeProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-attributes"],
        summary: "Create a new product attribute",
        description: "Creates a single product attribute with title and type",
        requestBody: {
          content: {
            "application/json": {
              example: { title: "Color", type: "string" },
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
        const process = getService<UpdateProductAttributesProcess>(UPDATE_PRODUCT_ATTRIBUTES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateProductAttributeProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-attributes"],
        summary: "Update a product attribute",
        description: "Updates an existing product attribute by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              example: { title: "Color", type: "string" },
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
        const process = getService<DeleteProductAttributesProcess>(DELETE_PRODUCT_ATTRIBUTES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteProductAttributesProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-attributes"],
        summary: "Delete product attributes",
        description: "Deletes multiple product attributes by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: { attribute_ids: ["550e8400-e29b-41d4-a716-446655440000"] },
            },
          },
        },
      },
    }
  );
