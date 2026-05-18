import { Type, type Static } from "@sinclair/typebox";

const ProductVariantPriceSchema = Type.Object({
  amount: Type.Number(),
  currency_code: Type.String(),
  min_quantity: Type.Optional(Type.Number()),
  max_quantity: Type.Optional(Type.Number()),
  price_list_id: Type.Optional(
    Type.String({
      format: "uuid",
    }),
  ),
});

const VariantInputSchema = Type.Object({
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
  media_ids: Type.Optional(
    Type.Array(
      Type.String({
        format: "uuid",
      }),
    ),
  ),
  prices: Type.Optional(Type.Array(ProductVariantPriceSchema)),
  metadata: Type.Optional(
    Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()])),
  ),
  option_values: Type.Array(
    Type.Object({
      title: Type.String(),
      value: Type.String(),
    }),
  ),
});

export const CreateProductVariantsSchema = Type.Object({
  product_id: Type.String({ format: "uuid" }),
  options: Type.Array(
    Type.Object({
      title: Type.String(),
      values: Type.Array(Type.String()),
    }),
  ),
  variants: Type.Array(VariantInputSchema),
});

export type CreateProductVariantsProcessInput = Static<
  typeof CreateProductVariantsSchema
>;

export const CreateProductVariantsResponseSchema = Type.Object({
  product_id: Type.String({ format: "uuid" }),
  variant_ids: Type.Array(Type.String({ format: "uuid" })),
});
export type CreateProductVariantsProcessOutput = Static<
  typeof CreateProductVariantsResponseSchema
>;
