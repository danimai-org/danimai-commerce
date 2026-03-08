import { Elysia } from "elysia";
import { StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_PRODUCT_OPTIONS_PROCESS,
  UPDATE_PRODUCT_OPTIONS_PROCESS,
  DELETE_PRODUCT_OPTIONS_PROCESS,
  PAGINATED_PRODUCT_OPTIONS_PROCESS,
  CreateProductOptionsProcess,
  UpdateProductOptionsProcess,
  DeleteProductOptionsProcess,
  PaginatedProductOptionsProcess,
  PaginatedProductOptionsSchema,
  PaginatedProductOptionsResponseSchema,
  RETRIEVE_PRODUCT_OPTION_PROCESS,
  RetrieveProductOptionProcess,
  RetrieveProductOptionResponseSchema,
  CreateProductOptionSchema,
  CreateProductOptionsResponseSchema,
  UpdateProductOptionSchema,
  UpdateProductOptionsResponseSchema,
  DeleteProductOptionsSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateProductOptionBodySchema = Type.Object({
  title: Type.Optional(Type.String()),
  product_id: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export const productOptionRoutes = new Elysia({ prefix: "/product-options" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedProductOptionsProcess>(PAGINATED_PRODUCT_OPTIONS_PROCESS);
      return process.runOperations({ input: query as StaticDecode<typeof PaginatedProductOptionsSchema> });
    },
    {
      query: PaginatedProductOptionsSchema,
      response: {
        200: PaginatedProductOptionsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Options"],
        summary: "Get paginated product options",
        description: "Gets a paginated list of product options",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveProductOptionProcess>(RETRIEVE_PRODUCT_OPTION_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: RetrieveProductOptionResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Options"],
        summary: "Get a product option by ID",
        description: "Retrieves a single product option by its ID",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateProductOptionsProcess>(CREATE_PRODUCT_OPTIONS_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateProductOptionSchema,
      response: {
        200: CreateProductOptionsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Options"],
        summary: "Create a new product option",
        description: "Creates a single product option with the provided details",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateProductOptionsProcess>(UPDATE_PRODUCT_OPTIONS_PROCESS);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateProductOptionBodySchema,
      response: {
        200: UpdateProductOptionsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Options"],
        summary: "Update a product option",
        description: "Updates an existing product option by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteProductOptionsProcess>(DELETE_PRODUCT_OPTIONS_PROCESS);
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductOptionsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Options"],
        summary: "Delete product options",
        description: "Deletes multiple product options by their IDs",
      },
    }
  );
