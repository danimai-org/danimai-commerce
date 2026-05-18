export type VariantOptionEntry = { optionTitle: string; value: string };

export type VariantOptionRef = { id: string; title: string; value: string; rank: number };

export type VariantForOptions = {
	title?: string | null;
	options?: VariantOptionRef[];
	sku?: string | null;
};

export type ProductOptionRef = { id: string; title: string };

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

function entriesFromTitleParts(parts: string[], productOptions: ProductOptionRef[]): VariantOptionEntry[] {
	if (parts.length === 0) return [];

	if (productOptions.length >= parts.length) {
		return productOptions
			.slice(0, parts.length)
			.map((opt, index) => ({
				optionTitle: opt.title,
				value: parts[index] ?? ''
			}))
			.filter((entry) => entry.value);
	}

	const titles = defaultOptionTitles(parts.length);
	return parts.map((value, index) => ({
		optionTitle: titles[index] ?? `Option ${index + 1}`,
		value
	}));
}

export function getVariantOptionEntries(
	variant: VariantForOptions,
	productOptions: ProductOptionRef[] = []
): VariantOptionEntry[] {
	const apiOptions = variant.options ?? [];
	if (apiOptions.length > 0) {
		return [...apiOptions]
			.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
			.map((o) => ({
				optionTitle: (o.title ?? '').trim(),
				value: (o.value ?? '').trim()
			}))
			.filter((e) => e.optionTitle && e.value);
	}

	const titleParts = splitVariantTitle(variant.title);
	if (titleParts.length > 0) {
		return entriesFromTitleParts(titleParts, productOptions);
	}

	if (productOptions.length === 0) return [];

	if (productOptions.length === 1) {
		const title = (variant.title ?? '').trim();
		if (!title) return [];
		return [{ optionTitle: productOptions[0].title, value: title }];
	}

	const parts = (variant.title ?? '')
		.split('/')
		.map((p) => p.trim())
		.filter(Boolean);

	return productOptions
		.map((opt, index) => ({
			optionTitle: opt.title,
			value: parts[index] ?? ''
		}))
		.filter((e) => e.value);
}

export function variantMatchesSearch(
	variant: VariantForOptions,
	query: string,
	productOptions: ProductOptionRef[] = []
): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;

	if ((variant.title ?? '').toLowerCase().includes(q)) return true;
	if ((variant.sku ?? '').toLowerCase().includes(q)) return true;

	for (const entry of getVariantOptionEntries(variant, productOptions)) {
		if (entry.optionTitle.toLowerCase().includes(q)) return true;
		if (entry.value.toLowerCase().includes(q)) return true;
	}

	return false;
}
