import { Elysia } from "elysia";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  UPDATE_PRODUCT_VARIANTS_PROCESS,
  DELETE_PRODUCT_VARIANTS_PROCESS,
  PAGINATED_PRODUCT_VARIANTS_PROCESS,
  UpdateProductVariantsProcess,
  DeleteProductVariantsProcess,
  PaginatedProductVariantsProcess,
  PaginatedProductVariantsSchema,
  PaginatedProductVariantsResponseSchema,
  RETRIEVE_PRODUCT_VARIANT_PROCESS,
  RetrieveProductVariantProcess,
  RetrieveProductVariantResponseSchema,
  UpdateProductVariantSchema,
  UpdateProductVariantsResponseSchema,
  DeleteProductVariantsSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateProductVariantBodySchema = Type.Object({
  title: Type.Optional(Type.String()),
  sku: Type.Optional(Type.String()),
  barcode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  allow_backorder: Type.Optional(Type.Boolean()),
  manage_inventory: Type.Optional(Type.Boolean()),
  variant_rank: Type.Optional(Type.Number()),
  thumbnail: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export const productVariantRoutes = new Elysia({ prefix: "/product-variants" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedProductVariantsProcess>(PAGINATED_PRODUCT_VARIANTS_PROCESS);
      return process.runOperations({ input: query as StaticDecode<typeof PaginatedProductVariantsSchema> });
    },
    {
      query: PaginatedProductVariantsSchema,
      response: {
        200: PaginatedProductVariantsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Variants"],
        summary: "Get paginated product variants",
        description: "Gets a paginated list of product variants",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveProductVariantProcess>(RETRIEVE_PRODUCT_VARIANT_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: RetrieveProductVariantResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Variants"],
        summary: "Get a product variant by ID",
        description: "Retrieves a single product variant by its ID",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body: input }) => {
      const process = getService<UpdateProductVariantsProcess>(UPDATE_PRODUCT_VARIANTS_PROCESS);
      const result = await process.runOperations({
        input: { ...input, id: params.id },
      });
      return Response.json(result ?? null);
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateProductVariantBodySchema,
      response: {
        200: UpdateProductVariantsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Variants"],
        summary: "Update a product variant",
        description: "Updates an existing product variant by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteProductVariantsProcess>(DELETE_PRODUCT_VARIANTS_PROCESS);
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductVariantsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Variants"],
        summary: "Delete product variants",
        description: "Deletes multiple product variants by their IDs",
      },
    }
  );
