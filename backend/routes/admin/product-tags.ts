import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService, PaginationSchema } from "@danimai/core";
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
  PaginatedProductTagsSchema,
  PaginatedProductsByTagSchema,
  RETRIEVE_PRODUCT_TAG_PROCESS,
  RetrieveProductTagProcess,
  CreateProductTagSchema,
  UpdateProductTagSchema,
  DeleteProductTagsSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateProductTagBodySchema = Type.Object({
  value: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export const productTagRoutes = new Elysia({ prefix: "/product-tags" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedProductTagsProcess>(PAGINATED_PRODUCT_TAGS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedProductTagsSchema as any,
      detail: {
        tags: ["Product Tags"],
        summary: "Get paginated product tags",
        description: "Gets a paginated list of product tags",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveProductTagProcess>(RETRIEVE_PRODUCT_TAG_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      detail: {
        tags: ["Product Tags"],
        summary: "Get a product tag by ID",
        description: "Retrieves a single product tag by its ID",
      },
    }
  )
  .get(
    "/:id/products",
    async ({ params, query }) => {
      const process = getService<PaginatedProductsByTagProcess>(PAGINATED_PRODUCTS_BY_TAG_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { tag_id: params.id, ...query };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      query: PaginationSchema as any,
      detail: {
        tags: ["Product Tags"],
        summary: "Get products by tag",
        description: "Gets a paginated list of products that have this tag",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateProductTagsProcess>(CREATE_PRODUCT_TAGS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateProductTagSchema as any,
      detail: {
        tags: ["Product Tags"],
        summary: "Create a new product tag",
        description: "Creates a single product tag with the provided details",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateProductTagsProcess>(UPDATE_PRODUCT_TAGS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateProductTagBodySchema as any,
      detail: {
        tags: ["Product Tags"],
        summary: "Update a product tag",
        description: "Updates an existing product tag by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteProductTagsProcess>(DELETE_PRODUCT_TAGS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductTagsSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Tags"],
        summary: "Delete product tags",
        description: "Deletes multiple product tags by their IDs",
      },
    }
  );
