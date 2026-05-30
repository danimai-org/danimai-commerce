import { rowsFromPaginated } from "../lib/api/storefront-api";
import { client } from "$lib/api/client.js";
import type { PageLoad } from "./$types";
import type { AdminCollectionRow } from "$lib/types/collection";
import {
	type ProductGridItem,
	toProductGridItem,
} from "$lib/types/product-grid";

export type HomeCollectionCard = {
	title: string;
	handle: string;
	image: string;
};

const DEFAULT_COLLECTION_IMAGES = [
	"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
	"https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
	"https://images.unsplash.com/photo-1617137968427-85924c2a0505?w=800&q=80",
];

function imageFromMetadata(metadata: unknown): string | null {
	if (!metadata || typeof metadata !== "object") return null;
	const m = metadata as Record<string, unknown>;
	for (const key of [
		"image",
		"cover_image",
		"thumbnail",
		"hero_image",
	] as const) {
		const v = m[key];
		if (typeof v === "string" && v.trim()) return v.trim();
	}
	return null;
}

async function loadAllCollections(): Promise<HomeCollectionCard[]> {
	const out: HomeCollectionCard[] = [];
	let page = 1;
	const limit = 100;
	for (;;) {
		const res = await client.admin.collections.get({
			query: { limit: String(limit), page: String(page) },
		});
		if (res.error) return out;
		const data = res.data as unknown;
		const { rows } = rowsFromPaginated<AdminCollectionRow>(data);
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const handle = (row.handle ?? "").trim();
			if (!handle) continue;
			out.push({
				title: row.title,
				handle,
				image:
					imageFromMetadata(row.metadata) ??
					DEFAULT_COLLECTION_IMAGES[
						out.length % DEFAULT_COLLECTION_IMAGES.length
					],
			});
		}
		const pag = (data as { pagination?: { has_next_page?: boolean } })
			.pagination;
		if (!pag?.has_next_page) break;
		page += 1;
		if (page > 500) break;
	}
	return out;
}

export type HomeProductGridItem = ProductGridItem;

export const load: PageLoad = async () => {
	const products: HomeProductGridItem[] = [];
	const collections = await loadAllCollections();
	let error: string | null = null;

	try {
		const sfRes = await client.storefront.products.get({
			query: { limit: "8", page: "1" },
		});
		if (sfRes.error || !sfRes.data) throw new Error("Failed to load products");
		const list = sfRes.data.rows ?? [];
		for (let i = 0; i < list.length; i++) {
			products.push(toProductGridItem(list[i], i));
		}
	} catch (e) {
		error = e instanceof Error ? e.message : "Failed to load products";
	}

	return { products, collections, error };
};
