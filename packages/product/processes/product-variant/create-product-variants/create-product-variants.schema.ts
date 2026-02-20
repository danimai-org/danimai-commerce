import { Type, type Static } from "typebox";

const ProductVariantPriceSchema = Type.Object({
  amount: Type.Number(),
  currency_code: Type.String(),
  min_quantity: Type.Optional(Type.Number()),
  max_quantity: Type.Optional(Type.Number()),
  price_list_id: Type.Optional(Type.String()),
});

export const CreateProductVariantSchema = Type.Object({
  title: Type.String(),
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
  prices: Type.Optional(Type.Array(ProductVariantPriceSchema)),
});

export type CreateProductVariantProcessInput = Static<
  typeof CreateProductVariantSchema
>;
