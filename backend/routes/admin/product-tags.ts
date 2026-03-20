import { Elysia } from "elysia";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_PRODUCT_TAGS_PROCESS,
  UPDATE_PRODUCT_TAG_PROCESS,
  DELETE_PRODUCT_TAGS_PROCESS,
  PAGINATED_PRODUCT_TAGS_PROCESS,
  UPDATE_PRODUCT_TAG_PRODUCTS_PROCESS,
  CreateProductTagsProcess,
  UpdateProductTagProcess,
  DeleteProductTagsProcess,
  PaginatedProductTagsProcess,
  UpdateProductTagProductsProcess,
  PaginatedProductTagsSchema,
  PaginatedProductTagsResponseSchema,
  RETRIEVE_PRODUCT_TAG_PROCESS,
  RetrieveProductTagProcess,
  RetrieveProductTagResponseSchema,
  CreateProductTagSchema,
  CreateProductTagResponseSchema,
  UpdateProductTagBodySchema,
  UpdateProductTagResponseSchema,
  DeleteProductTagsSchema,
  UpdateProductTagProductsBodySchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

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
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateProductTagsProcess>(CREATE_PRODUCT_TAGS_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateProductTagSchema,
      response: {
        200: CreateProductTagResponseSchema,
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
      const process = getService<UpdateProductTagProcess>(UPDATE_PRODUCT_TAG_PROCESS);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateProductTagBodySchema,
      response: {
        200: UpdateProductTagResponseSchema,
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
  .post(
    "/:id/products",
    async ({ params, body, set }) => {
      const process = getService<UpdateProductTagProductsProcess>(
        UPDATE_PRODUCT_TAG_PRODUCTS_PROCESS
      );
      await process.runOperations({
        input: {
          product_tag_id: params.id,
          products: { add: body.product_ids, remove: [] },
        },
      });
      set.status = 204;
      return undefined;
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateProductTagProductsBodySchema,
      response: {
        204: NoContentResponseSchema,
        404: NotFoundResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Tags"],
        summary: "Add products to a tag",
        description: "Links products to a product tag",
      },
    }
  )
  .delete(
    "/:id/products",
    async ({ params, body, set }) => {
      const process = getService<UpdateProductTagProductsProcess>(
        UPDATE_PRODUCT_TAG_PRODUCTS_PROCESS
      );
      await process.runOperations({
        input: {
          product_tag_id: params.id,
          products: { add: [], remove: body.product_ids },
        },
      });
      set.status = 204;
      return undefined;
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateProductTagProductsBodySchema,
      response: {
        204: NoContentResponseSchema,
        404: NotFoundResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Tags"],
        summary: "Remove products from a tag",
        description: "Unlinks products from a product tag",
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
