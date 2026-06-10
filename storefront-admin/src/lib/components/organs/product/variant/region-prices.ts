import { client } from '$lib/client.js';
import type { TableColumn } from '$lib/components/organs/index.js';

export type RegionPriceColumn = {
	id: string;
	name: string;
	currency_code: string;
	currency_symbol: string;
};

export type VariantPriceRow = {
	amount: string;
	currency_code: string;
};

export type RegionPricesMap = Record<string, string>;

export function createEmptyRegionPrices(regions: RegionPriceColumn[]): RegionPricesMap {
	return Object.fromEntries(regions.map((region) => [region.id, '']));
}

export function parseAmountToCents(amount: string): number {
	const trimmed = amount.trim();
	if (!trimmed) return Number.NaN;
	const value = parseFloat(trimmed);
	if (Number.isNaN(value) || value < 0) return Number.NaN;
	return Math.round(value * 100);
}

export function formatCentsToAmount(cents: string | number): string {
	const value = typeof cents === 'string' ? parseFloat(cents) : cents;
	if (!Number.isFinite(value)) return '';
	return (value / 100).toFixed(2);
}

export function formatRegionPriceDisplay(
	cents: string | undefined,
	symbol: string
): string {
	if (!cents) return '—';
	const amount = formatCentsToAmount(cents);
	return amount ? `${symbol}${amount}` : '—';
}

export function hasAnyRegionPrice(regionPrices: RegionPricesMap): boolean {
	return Object.values(regionPrices).some((amount) => {
		const cents = parseAmountToCents(amount);
		return Number.isFinite(cents) && cents > 0;
	});
}

export function buildRegionPriceTableColumns(regions: RegionPriceColumn[]): TableColumn[] {
	return regions.map((region) => ({
		label: `Price ${region.name}`,
		key: `price_${region.id}`
	}));
}

export function buildPricesFromRegionPrices(
	regionPrices: RegionPricesMap,
	regions: RegionPriceColumn[]
): Array<{ amount: number; currency_code: string }> {
	const regionById = new Map(regions.map((region) => [region.id, region]));
	const byCurrency = new Map<string, number>();

	for (const [regionId, amount] of Object.entries(regionPrices)) {
		const region = regionById.get(regionId);
		if (!region) continue;
		const cents = parseAmountToCents(amount);
		if (!Number.isFinite(cents) || cents <= 0) continue;
		byCurrency.set(region.currency_code.toLowerCase(), cents);
	}

	return Array.from(byCurrency.entries()).map(([currency_code, amount]) => ({
		amount,
		currency_code
	}));
}

export function mapPricesToRegionPrices(
	prices: VariantPriceRow[] | undefined,
	regions: RegionPriceColumn[]
): RegionPricesMap {
	const byCurrency = new Map<string, string>();
	for (const price of prices ?? []) {
		const code = price.currency_code?.toLowerCase();
		if (code && price.amount) byCurrency.set(code, price.amount);
	}

	return Object.fromEntries(
		regions.map((region) => {
			const cents = byCurrency.get(region.currency_code.toLowerCase());
			return [region.id, cents ? formatCentsToAmount(cents) : ''];
		})
	);
}

export function mapVariantPricesByCurrency(
	prices: VariantPriceRow[] | undefined
): Map<string, string> {
	const byCurrency = new Map<string, string>();
	for (const price of prices ?? []) {
		const code = price.currency_code?.toLowerCase();
		if (code && price.amount) byCurrency.set(code, price.amount);
	}
	return byCurrency;
}

export async function fetchActiveRegions(): Promise<RegionPriceColumn[]> {
	const res = await client.regions.get({ query: { page: 1, limit: 100 } });
	const rows = res.data?.rows ?? [];
	return rows
		.filter((row) => row.is_active)
		.map((row) => ({
			id: row.id,
			name: row.name,
			currency_code: row.currency_code,
			currency_symbol: row.currency_symbol?.trim() || row.currency_code.toUpperCase()
		}));
}
