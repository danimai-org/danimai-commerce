import { Type, type Static } from "@sinclair/typebox";

export const StorefrontRetrieveProductSchema = Type.Object({
  handle: Type.String(),
});

export type StorefrontRetrieveProductProcessInput = Static<
  typeof StorefrontRetrieveProductSchema
>;

const StorefrontProductMediaSchema = Type.Object({
  id: Type.String(),
  url: Type.String(),
  rank: Type.Number(),
});

const StorefrontVariantPriceSchema = Type.Object({
  amount: Type.String(),
  currency_code: Type.String(),
  min_quantity: Type.Union([Type.Number(), Type.Null()]),
  max_quantity: Type.Union([Type.Number(), Type.Null()]),
  price_list_id: Type.Union([Type.String(), Type.Null()]),
});

const StorefrontProductVariantSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  sku: Type.Union([Type.String(), Type.Null()]),
  thumbnail: Type.Union([Type.String(), Type.Null()]),
  variant_rank: Type.Union([Type.Number(), Type.Null()]),
  options: Type.Array(
    Type.Object({
      id: Type.String(),
      title: Type.String(),
      value: Type.String(),
      rank: Type.Number(),
    }),
  ),
  prices: Type.Array(StorefrontVariantPriceSchema),
});

const StorefrontDefaultVariantSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  sku: Type.Union([Type.String(), Type.Null()]),
  thumbnail: Type.Union([Type.String(), Type.Null()]),
  variant_rank: Type.Union([Type.Number(), Type.Null()]),
  price: Type.Union([StorefrontVariantPriceSchema, Type.Null()]),
});

export const StorefrontRetrieveProductResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  handle: Type.String(),
  thumbnail: Type.Union([Type.String(), Type.Null()]),
  description: Type.Union([Type.String(), Type.Null()]),
  media: Type.Array(StorefrontProductMediaSchema),
  variant: Type.Union([StorefrontDefaultVariantSchema, Type.Null()]),
  variants: Type.Array(StorefrontProductVariantSchema),
});

export type StorefrontRetrieveProductProcessOutput = Static<
  typeof StorefrontRetrieveProductResponseSchema
>;
