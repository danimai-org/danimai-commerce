export const API_BASE =
	(import.meta.env?.VITE_API_BASE as string | undefined) ?? 'http://localhost:8000/admin';

export function rowsFromPaginated<T>(body: unknown): { rows: T[]; total?: number } {
	const o = body as {
		rows?: T[];
		products?: T[];
		pagination?: { total?: number };
	};
	const rows = (o.rows ?? o.products ?? []) as T[];
	return { rows, total: o.pagination?.total };
}

export async function firstVariantIdByProductIds(
	apiBase: string,
	productIds: string[]
): Promise<Map<string, string>> {
	const map = new Map<string, string>();
	if (productIds.length === 0) return map;
	const need = new Set(productIds);
	let page = 1;
	const limit = 100;
	let totalPages = 1;
	do {
		const res = await fetch(`${apiBase}/product-variants?limit=${limit}&page=${page}`, {
			cache: 'no-store'
		});
		if (!res.ok) break;
		const data = (await res.json()) as {
			rows?: Array<{ id: string; product_id: string | null }>;
			pagination?: { total_pages?: number };
		};
		for (const v of data.rows ?? []) {
			if (v.product_id && need.has(v.product_id) && !map.has(v.product_id)) {
				map.set(v.product_id, v.id);
			}
		}
		totalPages = data.pagination?.total_pages ?? 1;
		page++;
		if (map.size >= need.size) break;
	} while (page <= totalPages && page <= 100);
	return map;
}
