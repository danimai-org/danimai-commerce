import type { AdminCategoryRow } from '$lib/types/categories';

export type CategoryNavRow = AdminCategoryRow;

export function categoryParentId(c: CategoryNavRow): string | null {
	const p = c.parent_id;
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
