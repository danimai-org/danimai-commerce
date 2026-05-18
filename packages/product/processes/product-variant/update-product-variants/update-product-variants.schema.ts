import { Type, type Static } from "@sinclair/typebox";

export const UpdateProductVariantSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  product_id: Type.Optional(Type.String()),
  sku: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  barcode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  ean: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  upc: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  allow_backorder: Type.Optional(Type.Boolean()),
  manage_inventory: Type.Optional(Type.Boolean()),
  variant_rank: Type.Optional(Type.Number()),
  thumbnail: Type.Optional(Type.String()),
  metadata: Type.Optional(
    Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()])),
  ),
});

export type UpdateProductVariantProcessInput = Static<
  typeof UpdateProductVariantSchema
>;

export const UpdateProductVariantsResponseSchema = Type.Union([
  Type.Undefined(),
]);
export type UpdateProductVariantsProcessOutput = Static<
  typeof UpdateProductVariantsResponseSchema
>;
