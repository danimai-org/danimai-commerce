import { client, type DetailById } from '$lib/client';

export type Category = DetailById<(typeof client)['product-categories']> | null;

export type CategoryAttribute = { id: string; title: string; type: string; required: boolean };

export type CategoryDetail = NonNullable<Category> & {
	attributes: CategoryAttribute[];
};

function normalizeCategoryAttributeItem(item: unknown): CategoryAttribute | null {
	if (item == null) return null;
	if (typeof item === 'string') {
		try {
			return normalizeCategoryAttributeItem(JSON.parse(item) as unknown);
		} catch {
			return null;
		}
	}
	if (typeof item !== 'object') return null;
	const r = item as Record<string, unknown>;
	const nested =
		r.attribute != null && typeof r.attribute === 'object'
			? (r.attribute as Record<string, unknown>)
			: r;
	const idRaw = nested.id ?? r.id;
	if (idRaw == null || idRaw === '') return null;
	const id = typeof idRaw === 'string' ? idRaw : String(idRaw);
	const title = typeof nested.title === 'string' ? nested.title : String(nested.title ?? '');
	const typeRaw = nested.type ?? nested.Type;
	const type = typeof typeRaw === 'string' ? typeRaw : typeRaw != null ? String(typeRaw) : '';
	const reqRaw = nested.required;
	const required = typeof reqRaw === 'boolean' ? reqRaw : false;
	return { id, title, type, required };
}

function parseStatus(raw: unknown): 'active' | 'inactive' {
	return raw === 'inactive' ? 'inactive' : 'active';
}

function parseVisibility(raw: unknown): 'public' | 'private' {
	return raw === 'private' ? 'private' : 'public';
}

function parseDateOrNull(raw: unknown): Date | null {
	if (raw == null) return null;
	if (raw instanceof Date) return raw;
	if (typeof raw === 'string' && raw.length > 0) return new Date(raw);
	return null;
}

function parseDate(raw: unknown): Date {
	if (raw instanceof Date) return raw;
	if (typeof raw === 'string' && raw.length > 0) return new Date(raw);
	return new Date();
}

export function parseCategoryPayload(raw: unknown): CategoryDetail | null {
	if (raw == null || typeof raw !== 'object') return null;
	let o = raw as Record<string, unknown>;
	while ('data' in o && o.data != null && typeof o.data === 'object' && !('value' in o)) {
		o = o.data as Record<string, unknown>;
	}
	const idRaw = o.id;
	const valueRaw = o.value;
	if (idRaw == null || idRaw === '' || valueRaw == null || valueRaw === '') return null;
	const id = typeof idRaw === 'string' ? idRaw : String(idRaw);
	const value = typeof valueRaw === 'string' ? valueRaw : String(valueRaw);
	let attrsRaw = o.attributes;
	if (attrsRaw == null) attrsRaw = [];
	else if (typeof attrsRaw === 'string') {
		try {
			attrsRaw = JSON.parse(attrsRaw);
		} catch {
			attrsRaw = [];
		}
	}
	if (!Array.isArray(attrsRaw)) attrsRaw = [];
	const attributes: CategoryAttribute[] = [];
	for (const a of attrsRaw as unknown[]) {
		const normalized = normalizeCategoryAttributeItem(a);
		if (normalized) attributes.push(normalized);
	}
	const handle = typeof o.handle === 'string' ? o.handle : '';
	const metadata = o.metadata;
	return {
		id,
		value,
		handle,
		metadata: metadata === undefined ? null : metadata,
		parent_id:
			o.parent_id === null || typeof o.parent_id === 'string' ? (o.parent_id as string | null) : null,
		status: parseStatus(o.status),
		visibility: parseVisibility(o.visibility),
		created_at: parseDate(o.created_at),
		updated_at: parseDate(o.updated_at),
		deleted_at: parseDateOrNull(o.deleted_at),
		attributes
	};
}
