import { Elysia, t } from "elysia";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  UPDATE_PRODUCT_VARIANTS_PROCESS,
  DELETE_PRODUCT_VARIANTS_PROCESS,
  PAGINATED_PRODUCT_VARIANTS_PROCESS,
  CREATE_PRODUCT_VARIANTS_PROCESS,
  UpdateProductVariantsProcess,
  DeleteProductVariantsProcess,
  PaginatedProductVariantsProcess,
  CreateProductVariantsProcess,
  PaginatedProductVariantsSchema,
  PaginatedProductVariantsResponseSchema,
  RETRIEVE_PRODUCT_VARIANT_PROCESS,
  UPDATE_PRODUCT_VARIANT_IMAGES_PROCESS,
  RetrieveProductVariantProcess,
  UpdateProductVariantImagesProcess,
  RetrieveProductVariantResponseSchema,
  UpdateProductVariantSchema,
  UpdateProductVariantsResponseSchema,
  DeleteProductVariantsSchema,
  CreateProductVariantsSchema,
  CreateProductVariantsResponseSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  NotFoundResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const ProductVariantPriceBodySchema = Type.Object({
  amount: Type.Number(),
  currency_code: Type.String(),
  min_quantity: Type.Optional(Type.Number()),
  max_quantity: Type.Optional(Type.Number()),
  price_list_id: Type.Optional(Type.String({ format: "uuid" })),
});

const UpdateProductVariantBodySchema = Type.Object({
  title: Type.Optional(Type.String()),
  sku: Type.Optional(Type.String()),
  barcode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  ean: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  upc: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  allow_backorder: Type.Optional(Type.Boolean()),
  manage_inventory: Type.Optional(Type.Boolean()),
  variant_rank: Type.Optional(Type.Number()),
  thumbnail: Type.Optional(Type.String()),
  thumbnail_media_id: Type.Optional(Type.Union([Type.String({ format: "uuid" }), Type.Null()])),
  media_ids: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
  prices: Type.Optional(Type.Array(ProductVariantPriceBodySchema)),
});

export const productVariantRoutes = new Elysia({ prefix: "/product-variants" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .post(
    "/",
    async ({ body }: { body: StaticDecode<typeof CreateProductVariantsSchema> }) => {
      const process = getService<CreateProductVariantsProcess>(CREATE_PRODUCT_VARIANTS_PROCESS);
      return process.runOperations({ input: body });
    },
    {
      body: CreateProductVariantsSchema,
      response: {
        200: CreateProductVariantsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Variants"],
        summary: "Replace product variants",
        description:
          "Deletes all existing variants for the given product and recreates them with the supplied options and variant set.",
      },
    }
  )
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
  .post(
    "/:id/images",
    async ({ params, body }: { params: { id: string }; body: { files?: File | File[]; delete_ids?: string[]; type?: string } }) => {
      const process = getService<UpdateProductVariantImagesProcess>(UPDATE_PRODUCT_VARIANT_IMAGES_PROCESS);
      return process.runOperations({
        input: {
          id: params.id,
          files: body.files,
          delete_ids: body.delete_ids,
          type: body.type,
        },
      });
    },
    {
      params: Type.Object({ id: Type.String({ format: "uuid" }) }),
      type: "multipart/form-data",
      body: t.Object({
        files: t.Optional(t.Union([t.File(), t.Array(t.File())])),
        delete_ids: t.Optional(t.Array(t.String({ format: "uuid" }))),
        type: t.Optional(t.String()),
      }),
      response: {
        200: t.Any(),
        400: ValidationErrorResponseSchema,
        404: NotFoundResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Product Variants"],
        summary: "Update variant images",
        description: "Uploads raw variant images and deletes selected existing media IDs.",
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
