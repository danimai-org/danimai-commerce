import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
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
  PAGINATED_PRODUCT_CATEGORIES_PROCESS,
  PaginatedProductCategoriesProcess,
  PaginatedProductCategoriesQuerySchema,
  PaginatedProductCategoriesResponseSchema,
  RETRIEVE_PRODUCT_CATEGORY_PROCESS,
  RetrieveProductCategoryProcess,
  RetrieveProductCategoryResponseSchema,
  CreateProductCategorySchema,
  CreateProductCategoriesResponseSchema,
  UpdateProductCategorySchema,
  UpdateProductCategoriesResponseSchema,
  DeleteProductCategoriesSchema,
  BatchLinkProductsToCategorySchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateProductCategoryBodySchema = Type.Object({
  value: Type.Optional(Type.String()),
  parent_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  status: Type.Optional(Type.String()),
  visibility: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

const BatchLinkProductsBodySchema = Type.Object({
  product_ids: Type.Array(Type.String()),
});

export const productCategoryRoutes = new Elysia({ prefix: "/product-categories" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedProductCategoriesProcess>(PAGINATED_PRODUCT_CATEGORIES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input: Record<string, unknown> = { ...query };
      if (query.page !== undefined) {
        const p = typeof query.page === "string" ? parseInt(query.page, 10) : query.page;
        input.page = Number.isNaN(p) ? 1 : Math.max(1, p);
      }
      if (query.limit !== undefined) {
        const l = typeof query.limit === "string" ? parseInt(query.limit, 10) : query.limit;
        input.limit = Number.isNaN(l) ? 10 : Math.max(1, Math.min(100, l));
      }
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedProductCategoriesQuerySchema,
      response: {
        200: PaginatedProductCategoriesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Categories"],
        summary: "Get paginated product categories",
        description: "Gets a paginated list of product categories",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveProductCategoryProcess>(RETRIEVE_PRODUCT_CATEGORY_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      response: {
        200: RetrieveProductCategoryResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Categories"],
        summary: "Get a product category by ID",
        description: "Retrieves a single product category by its ID",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateProductCategoriesProcess>(CREATE_PRODUCT_CATEGORIES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateProductCategorySchema as any,
      response: {
        200: CreateProductCategoriesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Categories"],
        summary: "Create a new product category",
        description: "Creates a single product category with the provided details",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateProductCategoriesProcess>(UPDATE_PRODUCT_CATEGORIES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateProductCategoryBodySchema as any,
      response: {
        200: UpdateProductCategoriesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Categories"],
        summary: "Update a product category",
        description: "Updates an existing product category by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteProductCategoriesProcess>(DELETE_PRODUCT_CATEGORIES_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductCategoriesSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Categories"],
        summary: "Delete product categories",
        description: "Deletes multiple product categories by their IDs",
      },
    }
  )
  .post(
    "/:id/products",
    async ({ params, body, set }) => {
      const process = getService<BatchLinkProductsToCategoryProcess>(
        BATCH_LINK_PRODUCTS_TO_CATEGORY_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({
        input: { ...(body as Record<string, unknown>), category_id: params.id },
        logger,
      } as any);
      set.status = 204;
      return undefined;
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: BatchLinkProductsBodySchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Categories"],
        summary: "Link products to category",
        description: "Links multiple products to a product category in a batch operation",
      },
    }
  );
