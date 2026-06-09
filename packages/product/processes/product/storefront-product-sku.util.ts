import { sql, type ExpressionBuilder } from "kysely";
import type { Database } from "../../db/type";

export function isValidSku(sku: string | null | undefined): boolean {
  return typeof sku === "string" && sku.trim() !== "";
}

/**
 * Storefront products require at least one non-deleted variant with a non-empty SKU.
 */
export function productHasValidSkuVariant(
  eb: ExpressionBuilder<Database, "products">,
) {
  return eb.exists(
    eb
      .selectFrom("product_variants")
      .select("product_variants.id")
      .whereRef("product_variants.product_id", "=", "products.id")
      .where("product_variants.deleted_at", "is", null)
      .where("product_variants.sku", "is not", null)
      .where(sql`trim(product_variants.sku)`, "!=", ""),
  );
}

/** Prefer variants with a valid SKU when picking a display variant for listings. */
export const variantSkuPreferenceOrder = sql`case when product_variants.sku is not null and trim(product_variants.sku) != '' then 0 else 1 end`;

export function compareVariantsBySkuPreference<
  T extends { sku: string | null; variant_rank: number | null },
>(a: T, b: T): number {
  const aHasSku = isValidSku(a.sku) ? 0 : 1;
  const bHasSku = isValidSku(b.sku) ? 0 : 1;
  if (aHasSku !== bHasSku) return aHasSku - bHasSku;

  const aRank = a.variant_rank ?? Number.POSITIVE_INFINITY;
  const bRank = b.variant_rank ?? Number.POSITIVE_INFINITY;
  return aRank - bRank;
}
