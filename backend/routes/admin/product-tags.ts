import { Elysia } from "elysia";
import { StaticDecode, Type } from "@sinclair/typebox";
import { getService, PaginationSchema } from "@danimai/core";
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
  PaginatedProductTagsResponseSchema,
  PaginatedProductsByTagSchema,
  PaginatedProductsByTagResponseSchema,
  RETRIEVE_PRODUCT_TAG_PROCESS,
  RetrieveProductTagProcess,
  RetrieveProductTagResponseSchema,
  CreateProductTagSchema,
  CreateProductTagsResponseSchema,
  UpdateProductTagSchema,
  UpdateProductTagsResponseSchema,
  DeleteProductTagsSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
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
    async ({ query }) => {
      const process = getService<PaginatedProductTagsProcess>(PAGINATED_PRODUCT_TAGS_PROCESS);
      return process.runOperations({ input: query as StaticDecode<typeof PaginatedProductTagsSchema> });
    },
    {
      query: PaginatedProductTagsSchema,
      response: {
        200: PaginatedProductTagsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: RetrieveProductTagResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      const input = { tag_id: params.id, ...query };
      return process.runOperations({ input });
    },
    {
      params: Type.Object({ id: Type.String() }),
      query: PaginationSchema,
      response: {
        200: PaginatedProductsByTagResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      return process.runOperations({ input });
    },
    {
      body: CreateProductTagSchema,
      response: {
        200: CreateProductTagsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateProductTagBodySchema,
      response: {
        200: UpdateProductTagsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductTagsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Tags"],
        summary: "Delete product tags",
        description: "Deletes multiple product tags by their IDs",
      },
    }
  );
