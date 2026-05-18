type VariantOption = { title: string; value: string };

type ExistingVariant = {
	id: string;
	title: string;
	sku: string | null;
	manage_inventory: boolean;
	allow_backorder: boolean;
	options?: VariantOption[];
};

function cartesian<T>(arrays: T[][]): T[][] {
	if (arrays.length === 0) return [];
	return arrays.reduce<T[][]>(
		(acc, curr) => acc.flatMap((prefix) => curr.map((value) => [...prefix, value])),
		[[]]
	);
}

function optionValuesKey(optionValues: VariantOption[]): string {
	return optionValues
		.map((o) => `${o.title}:${o.value}`)
		.sort()
		.join('|');
}

export function buildReplaceVariantsPayload(input: {
	productId: string;
	optionDrafts: Array<{ id: string; title: string; values: string[] }>;
	existingVariants: ExistingVariant[];
	priceCentsByVariantId: Map<string, string>;
}) {
	const optionsForApi = input.optionDrafts
		.map((draft) => ({
			title: draft.title.trim(),
			values: draft.values.map((value) => value.trim()).filter(Boolean)
		}))
		.filter((option) => option.title && option.values.length > 0);

	if (optionsForApi.length === 0) {
		throw new Error('At least one option with values is required');
	}

	const existingByKey = new Map<string, ExistingVariant>();
	for (const variant of input.existingVariants) {
		const key = optionValuesKey(variant.options ?? []);
		if (key) existingByKey.set(key, variant);
	}

	const combinations = cartesian(optionsForApi.map((option) => option.values));

	const variants = combinations.map((combo, index) => {
		const option_values = optionsForApi.map((option, optionIndex) => ({
			title: option.title,
			value: String(combo[optionIndex] ?? '').trim()
		}));
		const key = optionValuesKey(option_values);
		const existing = existingByKey.get(key);
		const title =
			optionsForApi.length === 1
				? option_values[0]?.value ?? ''
				: option_values.map((entry) => entry.value).join(' / ');

		const priceCents = existing ? input.priceCentsByVariantId.get(existing.id) : undefined;
		const parsedCents = priceCents ? parseInt(priceCents, 10) : Number.NaN;

		return {
			title,
			option_values,
			sku: existing?.sku ?? undefined,
			manage_inventory: existing?.manage_inventory ?? true,
			allow_backorder: existing?.allow_backorder ?? false,
			variant_rank: index,
			...(Number.isFinite(parsedCents) && parsedCents > 0
				? { prices: [{ amount: parsedCents, currency_code: 'eur' as const }] }
				: {})
		};
	});

	return {
		product_id: input.productId,
		options: optionsForApi,
		variants
	};
}
