import { Elysia } from "elysia";
import type { StaticDecode } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";
import { getService, PaginationSchema } from "@danimai/core";
import {
  CREATE_PRODUCT_ATTRIBUTE_PROCESS,
  UPDATE_PRODUCT_ATTRIBUTE_PROCESS,
  DELETE_PRODUCT_ATTRIBUTES_PROCESS,
  PAGINATED_PRODUCT_ATTRIBUTES_PROCESS,
  RETRIEVE_PRODUCT_ATTRIBUTE_PROCESS,
  CreateProductAttributeProcess,
  UpdateProductAttributeProcess,
  DeleteProductAttributesProcess,
  PaginatedProductAttributesProcess,
  RetrieveProductAttributeProcess,
  PaginatedProductAttributesSchema,
  PaginatedProductAttributesResponseSchema,
  RetrieveProductAttributeResponseSchema,
  CreateProductAttributeSchema,
  CreateProductAttributeResponseSchema,
  UpdateProductAttributeSchema,
  UpdateProductAttributeResponseSchema,
  DeleteProductAttributesSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";


export const productAttributeRoutes = new Elysia({ prefix: "/product-attributes" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedProductAttributesProcess>(PAGINATED_PRODUCT_ATTRIBUTES_PROCESS);
      return process.runOperations({ input: query as StaticDecode<typeof PaginatedProductAttributesSchema> });
    },
    {
      query: PaginatedProductAttributesSchema,
      response: {
        200: PaginatedProductAttributesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: RetrieveProductAttributeResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Attributes"],
        summary: "Get a product attribute by ID",
        description: "Retrieves a single product attribute by its ID",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateProductAttributeProcess>(CREATE_PRODUCT_ATTRIBUTE_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateProductAttributeSchema,
      response: {
        200: CreateProductAttributeResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
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
      const process = getService<UpdateProductAttributeProcess>(UPDATE_PRODUCT_ATTRIBUTE_PROCESS);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateProductAttributeSchema,
      response: {
        200: UpdateProductAttributeResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Attributes"],
        summary: "Update a product attribute",
        description: "Updates an existing product attribute by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ params, set }) => {
      const process = getService<DeleteProductAttributesProcess>(DELETE_PRODUCT_ATTRIBUTES_PROCESS);
      await process.runOperations({ input: params as StaticDecode<typeof DeleteProductAttributesSchema> });
      set.status = 204;
      return;
    },
    {
      params: DeleteProductAttributesSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Attributes"],
        summary: "Delete product attributes",
        description: "Deletes multiple product attributes by their IDs",
      },
    }
  );
