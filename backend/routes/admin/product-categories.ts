import { Elysia } from "elysia";
import { Type, type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_PRODUCT_CATEGORY_PROCESS,
  UPDATE_PRODUCT_CATEGORY_PROCESS,
  DELETE_PRODUCT_CATEGORIES_PROCESS,
  CreateProductCategoryProcess,
  UpdateProductCategoryProcess,
  DeleteProductCategoriesProcess,
  PAGINATED_PRODUCT_CATEGORIES_PROCESS,
  PaginatedProductCategoriesProcess,
  PaginatedProductCategoriesSchema,
  PaginatedProductCategoriesResponseSchema,
  RETRIEVE_PRODUCT_CATEGORY_PROCESS,
  RetrieveProductCategoryProcess,
  RetrieveProductCategoryResponseSchema,
  CreateProductCategorySchema,
  CreateProductCategoryResponseSchema,
  UpdateProductCategoryBodySchema,
  UpdateProductCategoryResponseSchema,
  DeleteProductCategoriesSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const productCategoryRoutes = new Elysia({ prefix: "/product-categories" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedProductCategoriesProcess>(PAGINATED_PRODUCT_CATEGORIES_PROCESS);
      return process.runOperations({ input: query as StaticDecode<typeof PaginatedProductCategoriesSchema> });
    },
    {
      query: PaginatedProductCategoriesSchema,
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
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: RetrieveProductCategoryResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
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
      const process = getService<CreateProductCategoryProcess>(CREATE_PRODUCT_CATEGORY_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateProductCategorySchema,
      response: {
        200: CreateProductCategoryResponseSchema,
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
      const process = getService<UpdateProductCategoryProcess>(UPDATE_PRODUCT_CATEGORY_PROCESS);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateProductCategoryBodySchema,
      response: {
        200: UpdateProductCategoryResponseSchema,
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
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductCategoriesSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Categories"],
        summary: "Delete product categories",
        description: "Deletes multiple product categories by their IDs",
      },
    }
  )
