import { Type, type Static } from "typebox";

export const ListProductVariantsBySkuSchema = Type.Object({
  sku: Type.String(),
});

export type ListProductVariantsBySkuProcessInput = Static<
  typeof ListProductVariantsBySkuSchema
>;
