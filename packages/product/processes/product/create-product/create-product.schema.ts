import { Type, type Static } from "typebox";

// Product Option Schema
const ProductOptionSchema = Type.Object({
  title: Type.String(),
  values: Type.Array(Type.String()),
});

// Product Variant Price Schema
const ProductVariantPriceSchema = Type.Object({
  amount: Type.Number(),
  currency_code: Type.String(),
  min_quantity: Type.Optional(Type.Number()),
  max_quantity: Type.Optional(Type.Number()),
  price_list_id: Type.Optional(Type.String()),
});

// Product Variant Schema
const ProductVariantSchema = Type.Object({
  title: Type.String(),
  sku: Type.Optional(Type.String()),
  barcode: Type.Optional(Type.String()),
  ean: Type.Optional(Type.String()),
  upc: Type.Optional(Type.String()),
  allow_backorder: Type.Optional(Type.Boolean()),
  manage_inventory: Type.Optional(Type.Boolean()),
  variant_rank: Type.Optional(Type.Number()),
  thumbnail: Type.Optional(Type.String()),
  options: Type.Optional(Type.Record(Type.String(), Type.String())), // Record<option_title, option_value>
  prices: Type.Optional(Type.Array(ProductVariantPriceSchema)),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

// Sales Channel Schema
const SalesChannelSchema = Type.Object({
  id: Type.String(),
});

// Attribute Schema
const AttributeSchema = Type.Object({
  id: Type.String(),
  value: Type.Any(),
});

export const CreateProductSchema = Type.Object({
  title: Type.String(),
  handle: Type.Optional(Type.String()),
  subtitle: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  is_giftcard: Type.Optional(Type.Boolean()),
  discountable: Type.Optional(Type.Boolean()),
  status: Type.Optional(Type.Union([Type.Literal("draft"), Type.Literal("proposed"), Type.Literal("published"), Type.Literal("rejected")])),
  thumbnail: Type.Optional(Type.String()),
  external_id: Type.Optional(Type.String()),
  category_id: Type.Optional(Type.String()),
  options: Type.Optional(Type.Array(ProductOptionSchema)),
  variants: Type.Optional(Type.Array(ProductVariantSchema)),
  sales_channels: Type.Optional(Type.Array(SalesChannelSchema)),
  tag_ids: Type.Optional(Type.Array(Type.String())),
  shipping_profile_id: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
  attributes: Type.Optional(Type.Array(AttributeSchema)),
});

export type CreateProductProcessInput = Static<
  typeof CreateProductSchema
>;
