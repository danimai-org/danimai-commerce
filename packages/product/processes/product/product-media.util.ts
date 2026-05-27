import type { Kysely } from "kysely";
import type { Database } from "../../db/type";
import type { MediaFileTable } from "@danimai/media";

export type ProductMediaItem = {
  id: string;
  url: string;
  rank: number;
};

type ProductMediaDatabase = Database & {
  media_files: MediaFileTable;
};

function parseRank(metadata: unknown, fallback: number): number {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const rankValue = (metadata as Record<string, unknown>).rank;
    if (typeof rankValue === "number" && Number.isFinite(rankValue)) {
      return rankValue;
    }
  }
  return fallback;
}

export async function loadProductMediaByProductIds(
  db: Kysely<Database>,
  productIds: string[],
): Promise<Map<string, ProductMediaItem[]>> {
  if (productIds.length === 0) return new Map();

  const mediaDb = db as unknown as Kysely<ProductMediaDatabase>;
  const mediaRows = await mediaDb
    .selectFrom("media_files")
    .where("owner_type", "=", "product")
    .where("owner_id", "in", productIds)
    .where("deleted_at", "is", null)
    .select(["id", "url", "metadata", "owner_id", "created_at"])
    .orderBy("created_at", "asc")
    .execute();

  const byProduct = new Map<string, ProductMediaItem[]>();
  for (const row of mediaRows) {
    const ownerId = row.owner_id;
    if (!ownerId) continue;
    const list = byProduct.get(ownerId) ?? [];
    list.push({
      id: row.id,
      url: row.url,
      rank: parseRank(row.metadata, list.length),
    });
    byProduct.set(ownerId, list);
  }

  for (const [productId, media] of byProduct) {
    media.sort((a, b) => a.rank - b.rank);
    byProduct.set(productId, media);
  }

  return byProduct;
}

export async function loadProductMedia(
  db: Kysely<Database>,
  productId: string,
): Promise<ProductMediaItem[]> {
  const map = await loadProductMediaByProductIds(db, [productId]);
  return map.get(productId) ?? [];
}

export function firstMediaUrl(media: ProductMediaItem[]): string | null {
  const url = media[0]?.url?.trim?.() ?? "";
  return url.length > 0 ? url : null;
}

export async function resolveProductThumbnail(
  db: Kysely<Database>,
  productId: string,
  productThumbnail: string | null | undefined,
  media: ProductMediaItem[],
): Promise<string | null> {
  const direct = productThumbnail?.trim?.() ?? "";
  if (direct.length > 0) return direct;

  const fromMedia = firstMediaUrl(media);
  if (fromMedia) return fromMedia;

  const legacy = await db
    .selectFrom("product_images")
    .where("product_id", "=", productId)
    .where("deleted_at", "is", null)
    .where("variant_id", "is", null)
    .select("url")
    .orderBy("rank", "asc")
    .executeTakeFirst();

  return legacy?.url ?? null;
}
