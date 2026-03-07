import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ProductVariantResponseSchema } from "../retrieve-product-variant/retrieve-product-variant.schema";

export const PaginatedProductVariantsSchema = createPaginationSchema(
  Type.Object({}),
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

// Request/Input schema
export type PaginatedProductVariantsProcessInput = StaticDecode<
  typeof PaginatedProductVariantsSchema
>;

// Response schema
export const PaginatedProductVariantsResponseSchema =
  createPaginatedResponseSchema(ProductVariantResponseSchema);
export type PaginatedProductVariantsProcessOutput = Static<
  typeof PaginatedProductVariantsResponseSchema
>;
