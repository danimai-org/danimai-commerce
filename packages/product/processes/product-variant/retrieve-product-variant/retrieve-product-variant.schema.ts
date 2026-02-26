import { Type, type Static } from "@sinclair/typebox";

export const RetrieveProductVariantSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductVariantProcessInput = Static<
  typeof RetrieveProductVariantSchema
>;

export const ProductVariantResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  sku: Type.Union([Type.String(), Type.Null()]),
  barcode: Type.Union([Type.String(), Type.Null()]),
  ean: Type.Union([Type.String(), Type.Null()]),
  upc: Type.Union([Type.String(), Type.Null()]),
  allow_backorder: Type.Boolean(),
  manage_inventory: Type.Boolean(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  variant_rank: Type.Union([Type.Number(), Type.Null()]),
  thumbnail: Type.Union([Type.String(), Type.Null()]),
  product_id: Type.Union([Type.String(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const RetrieveProductVariantResponseSchema = Type.Union([
  Type.Any(),
  Type.Undefined(),
]);
export type RetrieveProductVariantProcessOutput = Static<
  typeof RetrieveProductVariantResponseSchema
>;
