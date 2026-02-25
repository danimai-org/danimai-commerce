import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
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
  RETRIEVE_PRODUCT_OPTION_PROCESS,
  RetrieveProductOptionProcess,
  CreateProductOptionSchema,
  UpdateProductOptionSchema,
  DeleteProductOptionsSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
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
    async ({ query: input }) => {
      const process = getService<PaginatedProductOptionsProcess>(PAGINATED_PRODUCT_OPTIONS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedProductOptionsSchema as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateProductOptionSchema as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateProductOptionBodySchema as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductOptionsSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Options"],
        summary: "Delete product options",
        description: "Deletes multiple product options by their IDs",
      },
    }
  );
