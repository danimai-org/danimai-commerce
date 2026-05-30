import type { PageLoad } from "./$types";
import { SortOrder } from "@danimai/backend";
import { client } from "$lib/api/client.js";
import {
	type ProductGridItem,
	toProductGridItem,
} from "$lib/types/product-grid";

export type StoreProductGridItem = ProductGridItem;

export const load: PageLoad = async () => {
	const products: StoreProductGridItem[] = [];
	let error: string | null = null;

	try {
		let pageNum = 1;
		const limit = 100;
		for (;;) {
			const sfRes = await client.storefront.products.get({
				query: {
					limit: String(limit),
					page: String(pageNum),
					sorting_field: "products.title",
					sorting_direction: SortOrder.ASC,
				},
			});
			if (sfRes.error || !sfRes.data) throw new Error("Failed to load products");
			const list = sfRes.data.rows ?? [];
			const offset = products.length;
			for (let i = 0; i < list.length; i++) {
				products.push(
					toProductGridItem(list[i], offset + i, {
						preferProductThumbnail: true,
					}),
				);
			}
			const pag = sfRes.data.pagination;
			if (!pag?.has_next_page || list.length === 0) break;
			pageNum += 1;
			if (pageNum > 500) break;
		}
	} catch (e) {
		error = e instanceof Error ? e.message : "Failed to load products";
	}

	return { products, error };
};
