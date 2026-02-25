import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS,
  UPDATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS,
  DELETE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS,
  PAGINATED_PRODUCT_ATTRIBUTE_GROUPS_PROCESS,
  RETRIEVE_PRODUCT_ATTRIBUTE_GROUP_PROCESS,
  CreateProductAttributeGroupsProcess,
  UpdateProductAttributeGroupsProcess,
  DeleteProductAttributeGroupsProcess,
  PaginatedProductAttributeGroupsProcess,
  RetrieveProductAttributeGroupProcess,
  type CreateProductAttributeGroupProcessInput,
  type UpdateProductAttributeGroupProcessInput,
  type DeleteProductAttributeGroupsProcessInput,
  type PaginatedProductAttributeGroupsProcessInput,
  type RetrieveProductAttributeGroupProcessInput,
  PaginatedProductAttributeGroupsSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import Value from "typebox/value";

const productAttributeGroupsListHandler = async ({ query, set }: { query: Record<string, string>; set: any }) => {
  try {
    const process = getService<PaginatedProductAttributeGroupsProcess>(PAGINATED_PRODUCT_ATTRIBUTE_GROUPS_PROCESS);
    const logger = getService<Logger>(DANIMAI_LOGGER);
    const result = await process.runOperations({
      input: Value.Convert(PaginatedProductAttributeGroupsSchema, query) as PaginatedProductAttributeGroupsProcessInput,
      logger,
    });
    return result;
  } catch (err) {
    return handleProcessError(err, set);
  }
};

export const productAttributeGroupRoutes = new Elysia({ prefix: "/product-attribute-groups" })
  .get(
    "/",
    productAttributeGroupsListHandler,
    {
      detail: {
        tags: ["product-attribute-groups"],
        summary: "Get paginated product attribute groups",
        description: "Gets a paginated list of product attribute groups",
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
        const process = getService<RetrieveProductAttributeGroupProcess>(RETRIEVE_PRODUCT_ATTRIBUTE_GROUP_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { id: params.id } as RetrieveProductAttributeGroupProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-attribute-groups"],
        summary: "Get a product attribute group by ID",
        description: "Retrieves a single product attribute group by its ID with assigned attributes",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<CreateProductAttributeGroupsProcess>(CREATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: body as CreateProductAttributeGroupProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-attribute-groups"],
        summary: "Create a new product attribute group",
        description: "Creates a single product attribute group with title",
        requestBody: {
          content: {
            "application/json": {
              example: { title: "Specifications" },
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
        const process = getService<UpdateProductAttributeGroupsProcess>(UPDATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateProductAttributeGroupProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-attribute-groups"],
        summary: "Update a product attribute group",
        description: "Updates an existing product attribute group by ID; optionally sync assigned attributes via attribute_ids",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              example: { title: "Specifications", attribute_ids: [] },
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
        const process = getService<DeleteProductAttributeGroupsProcess>(DELETE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteProductAttributeGroupsProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["product-attribute-groups"],
        summary: "Delete product attribute groups",
        description: "Deletes multiple product attribute groups by their IDs (soft delete)",
        requestBody: {
          content: {
            "application/json": {
              example: { attribute_group_ids: ["550e8400-e29b-41d4-a716-446655440000"] },
            },
          },
        },
      },
    }
  );
