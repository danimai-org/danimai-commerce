import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService, PaginationSchema } from "@danimai/core";
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
  PaginatedProductAttributesSchema,
  CreateProductAttributeSchema,
  UpdateProductAttributeSchema,
  DeleteProductAttributesSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateProductAttributeBodySchema = Type.Object({
  title: Type.Optional(Type.String()),
  type: Type.Optional(Type.String()),
});

export const productAttributeRoutes = new Elysia({ prefix: "/product-attributes" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedProductAttributesProcess>(PAGINATED_PRODUCT_ATTRIBUTES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedProductAttributesSchema as any,
      detail: {
        tags: ["Product Attributes"],
        summary: "Get paginated product attributes",
        description: "Gets a paginated list of product attributes",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveProductAttributeProcess>(RETRIEVE_PRODUCT_ATTRIBUTE_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      detail: {
        tags: ["Product Attributes"],
        summary: "Get a product attribute by ID",
        description: "Retrieves a single product attribute by its ID",
      },
    }
  )
  .get(
    "/:id/products",
    async ({ params, query }) => {
      const process = getService<PaginatedProductsByAttributeProcess>(PAGINATED_PRODUCTS_BY_ATTRIBUTE_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { attribute_id: params.id, ...query };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      query: PaginationSchema as any,
      detail: {
        tags: ["Product Attributes"],
        summary: "Get products by attribute",
        description: "Gets a paginated list of products that have this attribute",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateProductAttributesProcess>(CREATE_PRODUCT_ATTRIBUTES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateProductAttributeSchema as any,
      detail: {
        tags: ["Product Attributes"],
        summary: "Create a new product attribute",
        description: "Creates a single product attribute with title and type",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateProductAttributesProcess>(UPDATE_PRODUCT_ATTRIBUTES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateProductAttributeBodySchema as any,
      detail: {
        tags: ["Product Attributes"],
        summary: "Update a product attribute",
        description: "Updates an existing product attribute by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteProductAttributesProcess>(DELETE_PRODUCT_ATTRIBUTES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductAttributesSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Attributes"],
        summary: "Delete product attributes",
        description: "Deletes multiple product attributes by their IDs",
      },
    }
  );
