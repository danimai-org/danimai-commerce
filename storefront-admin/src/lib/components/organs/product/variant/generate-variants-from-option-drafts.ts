import {
	cartesian,
	normalizeOptionDraftsForCombinations,
	optionValuesKey
} from './variant-combination-utils.js';
import { createEmptyRegionPrices, type RegionPriceColumn } from './region-prices.js';

export type VariantEditRow = {
	key: string;
	title: string;
	options: Record<string, string>;
	sku: string;
	manage_inventory: boolean;
	allow_backorder: boolean;
	variant_rank: number;
	regionPrices: Record<string, string>;
};

type OptionDraft = { title: string; values: string[] };

export function generateVariantEditRowsFromOptionDrafts(
	optionDrafts: OptionDraft[],
	regions: RegionPriceColumn[] = []
): VariantEditRow[] {
	const optionsForApi = normalizeOptionDraftsForCombinations(optionDrafts);

	if (optionsForApi.length === 0) return [];

	const combinations = cartesian(optionsForApi.map((option) => option.values));

	return combinations.map((combo, index) => {
		const optionsRecord: Record<string, string> = {};
		const option_values = optionsForApi.map((option, optionIndex) => {
			const value = String(combo[optionIndex] ?? '').trim();
			optionsRecord[option.title] = value;
			return { title: option.title, value };
		});
		const title =
			optionsForApi.length === 1
				? option_values[0]?.value ?? ''
				: option_values.map((entry) => entry.value).join(' / ');

		return {
			key: optionValuesKey(option_values),
			title,
			options: optionsRecord,
			sku: '',
			manage_inventory: true,
			allow_backorder: false,
			variant_rank: index,
			regionPrices: createEmptyRegionPrices(regions)
		};
	});
}
