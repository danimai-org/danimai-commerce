import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_PRODUCT_PROCESS,
  CREATE_PRODUCTS_PROCESS,
  UPDATE_PRODUCT_PROCESS,
  UPDATE_PRODUCTS_PROCESS,
  DELETE_PRODUCTS_PROCESS,
  PAGINATED_PRODUCTS_PROCESS,
  CreateProductProcess,
  CreateProductsProcess,
  UpdateProductProcess,
  UpdateProductsProcess,
  DeleteProductsProcess,
  PaginatedProductsProcess,
  PaginatedProductsQuerySchema,
  PaginatedProductsResponseSchema,
  CreateProductSchema,
  CreateProductsSchema,
  CreateProductResponseSchema,
  CreateProductsResponseSchema,
  RETRIEVE_PRODUCT_PROCESS,
  RetrieveProductProcess,
  RetrieveProductResponseSchema,
  UpdateProductSchema,
  UpdateProductsSchema,
  UpdateProductsResponseSchema,
  UpdateProductResponseSchema,
  DeleteProductsSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const productRoutes = new Elysia({ prefix: "/products" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedProductsProcess>(PAGINATED_PRODUCTS_PROCESS);
      const cleanedQuery: Record<string, unknown> = Object.fromEntries(
        Object.entries(query).filter(([_, value]) => value !== null && value !== undefined && value !== "")
      );
      if (typeof cleanedQuery.category_ids === "string") {
        cleanedQuery.category_ids = (cleanedQuery.category_ids as string).split(",").map((s) => s.trim()).filter(Boolean);
      }
      return process.runOperations({ input: cleanedQuery });
    },
    {
      query: PaginatedProductsQuerySchema,
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
    async ({ body: input }) => {
      const process = getService<CreateProductProcess>(CREATE_PRODUCT_PROCESS);
      return process.runOperations({ input });
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
    async ({ body: input }) => {
      const process = getService<CreateProductsProcess>(CREATE_PRODUCTS_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateProductsSchema,
      response: {
        200: CreateProductsResponseSchema,
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
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
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
  .put(
    "/batch",
    async ({ body: input }) => {
      const process = getService<UpdateProductsProcess>(UPDATE_PRODUCTS_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: UpdateProductsSchema,
      response: {
        200: UpdateProductsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Products"],
        summary: "Update multiple products",
        description: "Updates multiple products in a single batch operation",
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
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Products"],
        summary: "Delete products",
        description: "Deletes multiple products by their IDs",
      },
    }
  );
