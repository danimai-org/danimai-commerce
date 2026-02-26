import { Type, type Static } from "@sinclair/typebox";

export const ListProductVariantsBySkuSchema = Type.Object({
  sku: Type.String(),
});

export type ListProductVariantsBySkuProcessInput = Static<
  typeof ListProductVariantsBySkuSchema
>;

export const ListProductVariantsBySkuResponseSchema = Type.Object({
  variants: Type.Array(Type.Any()),
  product_summaries: Type.Record(Type.String(), Type.Any()),
});
export type ListProductVariantsBySkuProcessOutput = Static<
  typeof ListProductVariantsBySkuResponseSchema
>;
