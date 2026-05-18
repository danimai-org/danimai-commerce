import { Type, type Static } from "@sinclair/typebox";
import { ProductStatusEnum } from "../../../db/type";

// Product Option Schema
const ProductOptionSchema = Type.Object({
  title: Type.String(),
  values: Type.Array(Type.String()),
}); // Size -> S, M, L | Color -> Red, Green

// Product Variant Price Schema
export const ProductVariantPriceSchema = Type.Object({
  amount: Type.Number(),
  currency_code: Type.String(),
  min_quantity: Type.Optional(Type.Number()),
  max_quantity: Type.Optional(Type.Number()),
  price_list_id: Type.Optional(Type.String({ format: "uuid" })),
});

// Product Variant Schema
const ProductVariantSchema = Type.Object({
  option_values: Type.Array(
    Type.Object({
      title: Type.String(),
      value: Type.String(),
    }),
  ), // (Color -> Red, Size -> M), (Color -> Red, Size -> L)
  title: Type.String(),
  sku: Type.Optional(Type.String()),
  barcode: Type.Optional(Type.String()),
  ean: Type.Optional(Type.String()),
  upc: Type.Optional(Type.String()),
  allow_backorder: Type.Optional(Type.Boolean()),
  manage_inventory: Type.Optional(Type.Boolean()),
  variant_rank: Type.Optional(Type.Number()),
  thumbnail: Type.Optional(Type.String()),
  thumbnail_media_id: Type.Optional(Type.String({ format: "uuid" })),
  media_ids: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
  prices: Type.Optional(Type.Array(ProductVariantPriceSchema)),
  metadata: Type.Optional(
    Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()])),
  ),
});

<<<<<<< HEAD

=======
// Attribute value (scoped to group + attribute)
>>>>>>> 182ff3c92e5c9fc7fd38777be56211efb9c0f479
const AttributeValueSchema = Type.Object({
  attribute_id: Type.String({ format: "uuid" }),
  value: Type.Any(),
});

export const CreateProductSchema = Type.Object({
  title: Type.String(),
  handle: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  is_giftcard: Type.Boolean({ default: false }),
  discountable: Type.Boolean({ default: true }),
  status: Type.Enum(ProductStatusEnum, { default: ProductStatusEnum.DRAFT }),
  thumbnail: Type.Optional(Type.String()),
  thumbnail_media_id: Type.Optional(Type.String({ format: "uuid" })),
  media_ids: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
  external_id: Type.Optional(Type.String()),
  category_id: Type.Optional(Type.String({ format: "uuid" })),
  options: Type.Optional(Type.Array(ProductOptionSchema)),
  variants: Type.Optional(Type.Array(ProductVariantSchema)),
  sales_channel_ids: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
  tag_ids: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
  collection_ids: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
  shipping_profile_id: Type.Optional(Type.String({ format: "uuid" })),
  metadata: Type.Optional(
    Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()])),
  ),
  attributes: Type.Optional(
    Type.Array(AttributeValueSchema, { uniqueItems: true }),
  ),
});

export type CreateProductProcessInput = Static<typeof CreateProductSchema>;

export const CreateProductResponseSchema = Type.Object({
  id: Type.String(),
});
export type CreateProductProcessOutput = Static<
  typeof CreateProductResponseSchema
>;
