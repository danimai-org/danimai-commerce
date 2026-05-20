import {
	cartesian,
	normalizeOptionDraftsForCombinations,
	optionValuesKey,
	type VariantOptionValue
} from './variant-combination-utils.js';

type ExistingVariant = {
	id: string;
	title: string;
	sku: string | null;
	manage_inventory: boolean;
	allow_backorder: boolean;
	options?: VariantOptionValue[];
};

export { optionValuesKey } from './variant-combination-utils.js';

type VariantRowOverride = {
	key: string;
	title: string;
	sku: string;
	manage_inventory: boolean;
	allow_backorder: boolean;
	priceAmount: string;
};

export function buildReplaceVariantsPayload(input: {
	productId: string;
	optionDrafts: Array<{ id: string; title: string; values: string[] }>;
	existingVariants: ExistingVariant[];
	priceCentsByVariantId: Map<string, string>;
	variantEditRows?: VariantRowOverride[];
}) {
	const optionsForApi = normalizeOptionDraftsForCombinations(input.optionDrafts);

	if (optionsForApi.length === 0) {
		throw new Error('At least one option with values is required');
	}

	const existingByKey = new Map<string, ExistingVariant>();
	for (const variant of input.existingVariants) {
		let key = optionValuesKey(variant.options ?? []);
		if (!key && optionsForApi.length === 1) {
			const title = (variant.title ?? '').trim();
			const optionTitle = optionsForApi[0]?.title ?? '';
			if (title && optionTitle) {
				key = optionValuesKey([{ title: optionTitle, value: title }]);
			}
		}
		if (key) existingByKey.set(key, variant);
	}

	const combinations = cartesian(optionsForApi.map((option) => option.values));

	const overrideByKey = new Map((input.variantEditRows ?? []).map((row) => [row.key, row]));

	const variants = combinations.map((combo, index) => {
		const option_values = optionsForApi.map((option, optionIndex) => ({
			title: option.title,
			value: String(combo[optionIndex] ?? '').trim()
		}));
		const key = optionValuesKey(option_values);
		const existing = existingByKey.get(key);
		const override = overrideByKey.get(key);
		const defaultTitle =
			optionsForApi.length === 1
				? option_values[0]?.value ?? ''
				: option_values.map((entry) => entry.value).join(' / ');
		const title = override?.title.trim() || defaultTitle;

		let parsedCents = Number.NaN;
		const priceFromOverride = override?.priceAmount.trim();
		if (priceFromOverride) {
			const euros = parseFloat(priceFromOverride);
			if (!Number.isNaN(euros) && euros > 0) parsedCents = Math.round(euros * 100);
		}
		if (!Number.isFinite(parsedCents) || parsedCents <= 0) {
			const priceCents = existing ? input.priceCentsByVariantId.get(existing.id) : undefined;
			parsedCents = priceCents ? parseInt(priceCents, 10) : Number.NaN;
		}

		const trimmedSku = override?.sku.trim() || existing?.sku?.trim() || '';

		return {
			title,
			option_values,
			...(trimmedSku ? { sku: trimmedSku } : {}),
			manage_inventory: override?.manage_inventory ?? existing?.manage_inventory ?? true,
			allow_backorder: override?.allow_backorder ?? existing?.allow_backorder ?? false,
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
