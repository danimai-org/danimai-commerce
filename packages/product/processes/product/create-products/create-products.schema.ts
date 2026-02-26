import { Type, type Static } from "@sinclair/typebox";
import { CreateProductSchema } from "../create-product/create-product.schema";
import { ProductResponseSchema } from "../retrieve-product/retrieve-product.schema";

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

// Extended Product Schema
const CreateProductExtendedSchema = Type.Intersect([
  CreateProductSchema,
  Type.Object({
    options: Type.Optional(Type.Array(ProductOptionSchema)),
    variants: Type.Optional(Type.Array(ProductVariantSchema)),
    sales_channels: Type.Optional(Type.Array(SalesChannelSchema)),
    shipping_profile_id: Type.Optional(Type.String()),
  }),
]);

export const CreateProductsSchema = Type.Object({
  products: Type.Array(CreateProductExtendedSchema),
  additional_data: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});

export type CreateProductsProcessInput = Static<
  typeof CreateProductsSchema
>;

export const CreateProductsResponseSchema = Type.Array(ProductResponseSchema);
export type CreateProductsProcessOutput = Static<
  typeof CreateProductsResponseSchema
>;
