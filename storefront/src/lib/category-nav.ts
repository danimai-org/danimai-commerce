export type CategoryNavRow = {
	id: string;
	value: string;
	handle: string;
	parent_id?: string | null;
	parentId?: string | null;
};

export function categoryParentId(c: CategoryNavRow): string | null {
	const p = c.parent_id ?? c.parentId;
	return p == null || String(p).trim() === '' ? null : String(p);
}

export function isChildCategory(c: CategoryNavRow): boolean {
	return categoryParentId(c) !== null;
}

const BOTTOM_HINT =
	/(pants|trouser|shorts?|skirts?|denim|jeans?|leggings?|joggers?|chinos?|cargo|briefs?|bottoms?)/i;

export function isBottomCategory(c: Pick<CategoryNavRow, 'value' | 'handle'>): boolean {
	return BOTTOM_HINT.test(`${c.value} ${c.handle}`);
}
