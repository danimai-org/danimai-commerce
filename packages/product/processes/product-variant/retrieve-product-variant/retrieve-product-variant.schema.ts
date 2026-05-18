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
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
  prices: Type.Optional(
    Type.Array(
      Type.Object({
        amount: Type.String(),
        currency_code: Type.String(),
      }),
    ),
  ),
  options: Type.Optional(
    Type.Array(
      Type.Object({
        id: Type.String(),
        title: Type.String(),
        value: Type.String(),
        rank: Type.Number(),
      }),
    ),
  ),
  price_sets: Type.Optional(
    Type.Array(
      Type.Object({
        id: Type.String(),
        prices: Type.Array(
          Type.Object({
            id: Type.String(),
            amount: Type.String(),
            currency_code: Type.String(),
            min_quantity: Type.Union([Type.Number(), Type.Null()]),
            max_quantity: Type.Union([Type.Number(), Type.Null()]),
          }),
        ),
      }),
    ),
  ),
});

export const RetrieveProductVariantResponseSchema = Type.Union([
  ProductVariantResponseSchema,
  Type.Undefined(),
]);
export type RetrieveProductVariantProcessOutput = Static<
  typeof RetrieveProductVariantResponseSchema
>;
