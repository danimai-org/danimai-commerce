import type { client } from '$lib/client';

export type AttributeGroup =
	| Awaited<ReturnType<ReturnType<(typeof client)['product-attribute-groups']>['get']>>['data']
	| null;

export type AttributeGroupAttribute = { id: string; title: string; type: string; required: boolean };

export type AttributeGroupDetail = {
	id: string;
	title: string;
	metadata: unknown | null;
	attributes: AttributeGroupAttribute[];
	created_at?: string | Date;
	updated_at?: string | Date;
};

function normalizeAttributeGroupItem(item: unknown): AttributeGroupAttribute | null {
	if (item == null) return null;
	if (typeof item === 'string') {
		try {
			return normalizeAttributeGroupItem(JSON.parse(item) as unknown);
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

export function parseAttributeGroupPayload(raw: unknown): AttributeGroupDetail | null {
	if (raw == null || typeof raw !== 'object') return null;
	let o = raw as Record<string, unknown>;
	while ('data' in o && o.data != null && typeof o.data === 'object' && !('title' in o)) {
		o = o.data as Record<string, unknown>;
	}
	const id = o.id;
	const title = o.title;
	if (typeof id !== 'string' || typeof title !== 'string') return null;
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
	const attributes: AttributeGroupAttribute[] = [];
	for (const a of attrsRaw as unknown[]) {
		const normalized = normalizeAttributeGroupItem(a);
		if (normalized) attributes.push(normalized);
	}
	const metadata = o.metadata;
	const created_at = o.created_at;
	const updated_at = o.updated_at;
	return {
		id,
		title,
		metadata: metadata === undefined ? null : metadata,
		attributes,
		...(typeof created_at === 'string' || created_at instanceof Date ? { created_at } : {}),
		...(typeof updated_at === 'string' || updated_at instanceof Date ? { updated_at } : {})
	};
}
