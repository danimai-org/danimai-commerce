import { Type, type Static } from "typebox";

export const AttributeValueSchema = Type.Object({
  attribute_id: Type.String(),
  value: Type.String(),
});

export const UpdateProductVariantSchema = Type.Object({
  id: Type.String(),
  title: Type.Optional(Type.String()),
  product_id: Type.Optional(Type.String()),
  sku: Type.Optional(Type.String()),
  barcode: Type.Optional(Type.String()),
  ean: Type.Optional(Type.String()),
  upc: Type.Optional(Type.String()),
  allow_backorder: Type.Optional(Type.Boolean()),
  manage_inventory: Type.Optional(Type.Boolean()),
  variant_rank: Type.Optional(Type.Number()),
  thumbnail: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
  attribute_values: Type.Optional(Type.Array(AttributeValueSchema)),
});

export type UpdateProductVariantProcessInput = Static<
  typeof UpdateProductVariantSchema
>;
