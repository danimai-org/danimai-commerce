import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  createPaginationSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { ProductVariant } from "../../../db/type";
import { ProductVariantResponseSchema } from "../retrieve-product-variant/retrieve-product-variant.schema";

const productVariantsFiltersSchema =
  createFilterableColumnsSchema<
    keyof Pick<ProductVariant, "title" | "sku" | "product_id">
  >({
    title: true,
    sku: true,
    product_id: [
      FilterOperator.EQUAL,
      FilterOperator.NOT_EQUAL,
      FilterOperator.IS_NULL,
      FilterOperator.IS_NOT_NULL,
    ],
  });

export const PaginatedProductVariantsSchema = createPaginationSchema(
  productVariantsFiltersSchema,
  [
    "id",
    "title",
    "sku",
    "barcode",
    "ean",
    "upc",
    "product_id",
    "variant_rank",
    "allow_backorder",
    "manage_inventory",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
);

const paginationQueryProperties = (PaginationSchema as unknown as {
  properties?: Record<string, unknown>;
}).properties ?? {};

/** Query-only schema for Elysia route (single Type.Object; Intersect is not supported by Elysia query validation). */
export const PaginatedProductVariantsQuerySchema = Type.Object({
  ...paginationQueryProperties,
  filters: Type.Optional(productVariantsFiltersSchema),
});

export type PaginatedProductVariantsProcessInput = Static<
  typeof PaginatedProductVariantsSchema
>;

export const PaginatedProductVariantsResponseSchema =
  createPaginatedResponseSchema(ProductVariantResponseSchema);
export type PaginatedProductVariantsProcessOutput = Static<
  typeof PaginatedProductVariantsResponseSchema
>;
