import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS,
  UPDATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS,
  DELETE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS,
  PAGINATED_PRODUCT_ATTRIBUTE_GROUPS_PROCESS,
  RETRIEVE_PRODUCT_ATTRIBUTE_GROUP_PROCESS,
  CreateProductAttributeGroupsProcess,
  UpdateProductAttributeGroupsProcess,
  DeleteProductAttributeGroupsProcess,
  PaginatedProductAttributeGroupsProcess,
  RetrieveProductAttributeGroupProcess,
  PaginatedProductAttributeGroupsSchema,
  PaginatedProductAttributeGroupsResponseSchema,
  RetrieveProductAttributeGroupResponseSchema,
  CreateProductAttributeGroupSchema,
  CreateProductAttributeGroupsResponseSchema,
  UpdateProductAttributeGroupsResponseSchema,
  DeleteProductAttributeGroupsSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateProductAttributeGroupBodySchema = Type.Object({
  title: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
  attribute_ids: Type.Optional(Type.Array(Type.String())),
});

export const productAttributeGroupRoutes = new Elysia({ prefix: "/product-attribute-groups" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedProductAttributeGroupsProcess>(PAGINATED_PRODUCT_ATTRIBUTE_GROUPS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedProductAttributeGroupsSchema as any,
      response: {
        200: PaginatedProductAttributeGroupsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Attribute Groups"],
        summary: "Get paginated product attribute groups",
        description: "Gets a paginated list of product attribute groups",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveProductAttributeGroupProcess>(RETRIEVE_PRODUCT_ATTRIBUTE_GROUP_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      response: {
        200: RetrieveProductAttributeGroupResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Attribute Groups"],
        summary: "Get a product attribute group by ID",
        description: "Retrieves a single product attribute group by its ID with assigned attributes",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateProductAttributeGroupsProcess>(CREATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateProductAttributeGroupSchema as any,
      response: {
        200: CreateProductAttributeGroupsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Attribute Groups"],
        summary: "Create a new product attribute group",
        description: "Creates a single product attribute group with title",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateProductAttributeGroupsProcess>(UPDATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateProductAttributeGroupBodySchema as any,
      response: {
        200: UpdateProductAttributeGroupsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Attribute Groups"],
        summary: "Update a product attribute group",
        description: "Updates an existing product attribute group by ID; optionally sync assigned attributes via attribute_ids",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteProductAttributeGroupsProcess>(DELETE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductAttributeGroupsSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Attribute Groups"],
        summary: "Delete product attribute groups",
        description: "Deletes multiple product attribute groups by their IDs (soft delete)",
      },
    }
  );
