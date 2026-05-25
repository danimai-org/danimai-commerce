export type CategoryAttributeCatalogRow = { id: string; title: string; type: string };

export function uniqueSelectedAttributeIds(ids: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const id of ids) {
		if (seen.has(id)) continue;
		seen.add(id);
		out.push(id);
	}
	return out;
}

export function normalizeCategoryAttributeCatalogRows(rows: unknown[]): CategoryAttributeCatalogRow[] {
	const out: CategoryAttributeCatalogRow[] = [];
	for (const raw of rows) {
		if (raw == null || typeof raw !== 'object') continue;
		const r = raw as Record<string, unknown>;
		const idRaw = r.id;
		if (idRaw == null || idRaw === '') continue;
		const id = typeof idRaw === 'string' ? idRaw : String(idRaw);
		const title = typeof r.title === 'string' ? r.title : r.title != null ? String(r.title) : '';
		const typeRaw = r.type;
		const type = typeof typeRaw === 'string' ? typeRaw : typeRaw != null ? String(typeRaw) : '';
		out.push({ id, title, type });
	}
	return out;
}
