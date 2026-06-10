import {
	cartesian,
	normalizeOptionDraftsForCombinations,
	optionValuesKey,
	type VariantOptionValue
} from './variant-combination-utils.js';
import {
	buildPricesFromRegionPrices,
	formatCentsToAmount,
	type RegionPriceColumn,
	type RegionPricesMap
} from './region-prices.js';

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
	regionPrices: RegionPricesMap;
};

export function buildReplaceVariantsPayload(input: {
	productId: string;
	optionDrafts: Array<{ id: string; title: string; values: string[] }>;
	existingVariants: ExistingVariant[];
	priceCentsByVariantId: Map<string, Map<string, string>>;
	regions: RegionPriceColumn[];
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

		let regionPrices = { ...override?.regionPrices };
		const hasOverridePrices = Object.values(regionPrices).some((amount) => amount.trim());
		if (!hasOverridePrices && existing) {
			const priceByCurrency = input.priceCentsByVariantId.get(existing.id);
			if (priceByCurrency) {
				regionPrices = Object.fromEntries(
					input.regions.map((region) => {
						const cents = priceByCurrency.get(region.currency_code.toLowerCase());
						return [region.id, cents ? formatCentsToAmount(cents) : ''];
					})
				);
			}
		}

		const prices = buildPricesFromRegionPrices(regionPrices, input.regions);
		const trimmedSku = override?.sku.trim() || existing?.sku?.trim() || '';

		return {
			title,
			option_values,
			...(trimmedSku ? { sku: trimmedSku } : {}),
			manage_inventory: override?.manage_inventory ?? existing?.manage_inventory ?? true,
			allow_backorder: override?.allow_backorder ?? existing?.allow_backorder ?? false,
			variant_rank: index,
			...(prices.length > 0 ? { prices } : {})
		};
	});

	return {
		product_id: input.productId,
		options: optionsForApi,
		variants
	};
}
