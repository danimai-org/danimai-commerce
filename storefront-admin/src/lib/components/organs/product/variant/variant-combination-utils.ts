export type VariantOptionValue = { title: string; value: string };

export type NormalizedOptionDraft = { title: string; values: string[] };

export function cartesian<T>(arrays: T[][]): T[][] {
	if (arrays.length === 0) return [];
	return arrays.reduce<T[][]>(
		(acc, curr) => acc.flatMap((prefix) => curr.map((value) => [...prefix, value])),
		[[]]
	);
}

export function optionValuesKey(optionValues: VariantOptionValue[]): string {
	return optionValues
		.map((o) => `${o.title}:${o.value}`)
		.sort()
		.join('|');
}

export function normalizeOptionDraftsForCombinations(
	drafts: Array<{ title: string; values: string[] }>
): NormalizedOptionDraft[] {
	return drafts
		.map((draft) => ({
			title: draft.title.trim(),
			values: draft.values.map((value) => value.trim()).filter(Boolean)
		}))
		.filter((option) => option.title && option.values.length > 0);
}
