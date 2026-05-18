import type { VariantOptionRef } from './variant-option-entries.js';

export type DerivedProductOption = {
	id: string;
	title: string;
	product_id: string | null;
	values: Array<{ id?: string; value?: string }>;
};

type VariantWithOptions = {
	product_id?: string | null;
	title?: string | null;
	options?: VariantOptionRef[];
};

function splitVariantTitle(title: string | null | undefined): string[] {
	return (title ?? '')
		.split('/')
		.map((part) => part.trim())
		.filter(Boolean);
}

function defaultOptionTitles(count: number): string[] {
	if (count === 1) return ['Variant'];
	if (count === 2) return ['Color', 'Size'];
	return Array.from({ length: count }, (_, index) => `Option ${index + 1}`);
}

function deriveOptionsFromVariantTitles(variants: VariantWithOptions[]): DerivedProductOption[] {
	if (variants.length === 0) return [];

	const partsByVariant = variants.map((variant) => splitVariantTitle(variant.title));
	const optionCount = Math.max(...partsByVariant.map((parts) => parts.length), 0);
	if (optionCount === 0) return [];

	const titles = defaultOptionTitles(optionCount);
	const productId = variants[0]?.product_id ?? null;

	return titles.map((title, optionIndex) => {
		const values = new Set<string>();
		for (const parts of partsByVariant) {
			if (parts[optionIndex]) values.add(parts[optionIndex]);
		}
		return {
			id: `title-option-${optionIndex}`,
			title,
			product_id: productId,
			values: Array.from(values).map((value, valueIndex) => ({
				id: `title-option-${optionIndex}-${valueIndex}`,
				value
			}))
		};
	});
}

export function deriveProductOptionsFromVariants(
	variants: VariantWithOptions[]
): DerivedProductOption[] {
	const byTitle = new Map<
		string,
		{ id: string; title: string; values: Map<string, { id?: string; value?: string }> }
	>();

	for (const variant of variants) {
		for (const opt of variant.options ?? []) {
			const title = (opt.title ?? '').trim();
			const value = (opt.value ?? '').trim();
			if (!title || !value) continue;

			let entry = byTitle.get(title);
			if (!entry) {
				entry = { id: opt.id, title, values: new Map() };
				byTitle.set(title, entry);
			}
			if (!entry.values.has(value)) {
				entry.values.set(value, { id: opt.id, value });
			}
		}
	}

	const productId = variants[0]?.product_id ?? null;

	const fromRelations = Array.from(byTitle.values()).map((entry) => ({
		id: entry.id,
		title: entry.title,
		product_id: productId,
		values: Array.from(entry.values.values())
	}));

	if (fromRelations.length > 0) return fromRelations;

	return deriveOptionsFromVariantTitles(variants);
}
