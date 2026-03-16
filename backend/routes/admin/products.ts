import { Elysia } from "elysia";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_PRODUCT_PROCESS,
  UPDATE_PRODUCT_PROCESS,
  DELETE_PRODUCTS_PROCESS,
  PAGINATED_PRODUCTS_PROCESS,
  CreateProductProcess,
  UpdateProductProcess,
  DeleteProductsProcess,
  PaginatedProductsProcess,
  PaginatedProductsResponseSchema,
  CreateProductSchema,

  CreateProductResponseSchema,
  RETRIEVE_PRODUCT_PROCESS,
  RetrieveProductProcess,
  RetrieveProductResponseSchema,
  UpdateProductSchema,

  UpdateProductResponseSchema,
  DeleteProductsSchema,
  PaginatedProductsSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const productRoutes = new Elysia({ prefix: "/products" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedProductsProcess>(PAGINATED_PRODUCTS_PROCESS);
      return process.runOperations({ input: query as StaticDecode<typeof PaginatedProductsSchema> });
    },
    {
      query: PaginatedProductsSchema,
      response: {
        200: PaginatedProductsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Products"],
        summary: "Get paginated products",
        description: "Gets a paginated list of products",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveProductProcess>(RETRIEVE_PRODUCT_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: RetrieveProductResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Products"],
        summary: "Get a product by ID",
        description: "Retrieves a single product by its ID",
      },
    }
  )
  .post(
    "/",
    async ({ body }) => {
      const process = getService<CreateProductProcess>(CREATE_PRODUCT_PROCESS);
      return process.runOperations({ input: body as StaticDecode<typeof CreateProductSchema> });
    },
    {
      body: CreateProductSchema,
      response: {
        200: CreateProductResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Products"],
        summary: "Create a new product",
        description: "Creates a single product with options, variants, prices, and sales channels (similar to Danimai's createProductsWorkflow)",
      },
    }
  )
  .post(
    "/batch",
    async ({ body }) => {
      const process = getService<CreateProductProcess>(CREATE_PRODUCT_PROCESS);
      return process.runOperations({ input: body as StaticDecode<typeof CreateProductSchema> });
    },
    {
      body: CreateProductSchema,
      response: {
        200: CreateProductResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Products"],
        summary: "Create multiple products",
        description: "Creates multiple products in a single batch operation",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateProductProcess>(UPDATE_PRODUCT_PROCESS);
      await process.runOperations({
        input: { ...body, id: params.id },
      });
      return undefined;
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: Type.Omit(UpdateProductSchema, ["id"]),
      response: {
        200: UpdateProductResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Products"],
        summary: "Update a product",
        description: "Updates an existing product by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteProductsProcess>(DELETE_PRODUCTS_PROCESS);
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Products"],
        summary: "Delete products",
        description: "Deletes multiple products by their IDs",
      },
    }
  );
