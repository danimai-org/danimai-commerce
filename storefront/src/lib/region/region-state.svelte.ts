import { client } from "$lib/api/client";
import { normalizeCurrencyCode } from "$lib/pricing";

export type StorefrontRegion = {
	id: string;
	name: string;
	code: string;
	currency_code: string;
	currency_symbol: string | null;
	is_active: boolean;
};

const REGION_STORAGE_KEY = "dm_sf_region_id";

export const regionState = $state({
	regions: [] as StorefrontRegion[],
	selectedRegionId: null as string | null,
	loading: false,
	initialized: false,
	error: null as string | null,
});

let initPromise: Promise<void> | null = null;

function readStoredRegionId(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(REGION_STORAGE_KEY);
}

function writeStoredRegionId(regionId: string) {
	if (typeof window === "undefined") return;
	localStorage.setItem(REGION_STORAGE_KEY, regionId);
}

export function getSelectedRegion(): StorefrontRegion | null {
	if (!regionState.selectedRegionId) return null;
	return (
		regionState.regions.find((region) => region.id === regionState.selectedRegionId) ??
		null
	);
}

export function getSelectedCurrencyCode(): string {
	const region = getSelectedRegion();
	return normalizeCurrencyCode(region?.currency_code ?? "EUR");
}

function countryFromNavigatorLanguage(): string | null {
	if (typeof navigator === "undefined") return null;
	const locale = navigator.language?.trim();
	if (!locale) return null;
	const parts = locale.split(/[-_]/);
	if (parts.length < 2) return null;
	return parts[1]?.toUpperCase() ?? null;
}

async function fetchActiveRegions(): Promise<StorefrontRegion[]> {
	const res = await client.admin.regions.get({ query: { page: 1, limit: 100 } });
	if (res.error || !res.data) {
		throw new Error(res.error?.value?.message ?? "Failed to load regions");
	}
	const rows = res.data.rows ?? [];
	return rows
		.filter((row) => row.is_active)
		.map((row) => ({
			id: row.id,
			name: row.name,
			code: row.code,
			currency_code: row.currency_code,
			currency_symbol: row.currency_symbol ?? null,
			is_active: row.is_active,
		}));
}

async function resolveRegionIdForCountry(
	countryCode: string,
	regions: StorefrontRegion[],
): Promise<string | null> {
	const normalized = countryCode.trim().toUpperCase();
	if (!normalized) return null;

	let page = 1;
	let hasNext = true;
	while (hasNext) {
		const res = await client.admin.regions.countries.get({
			query: { page, limit: 100 },
		});
		if (res.error || !res.data) break;
		const rows = res.data.rows ?? [];
		const match = rows.find(
			(row) => String(row.iso_2 ?? "").toUpperCase() === normalized,
		);
		if (match?.region_id) {
			const region = regions.find((item) => item.id === match.region_id);
			if (region) return region.id;
		}
		hasNext = res.data.pagination?.has_next_page ?? false;
		page += 1;
	}
	return null;
}

function pickDefaultRegionId(
	regions: StorefrontRegion[],
	detectedCountryCode?: string | null,
): string | null {
	if (regions.length === 0) return null;
	const stored = readStoredRegionId();
	if (stored && regions.some((region) => region.id === stored)) {
		return stored;
	}
	return null;
}

async function detectDefaultRegionId(
	regions: StorefrontRegion[],
	detectedCountryCode?: string | null,
): Promise<string | null> {
	const stored = pickDefaultRegionId(regions, detectedCountryCode);
	if (stored) return stored;

	const countryCandidates = [
		detectedCountryCode,
		countryFromNavigatorLanguage(),
	].filter((value): value is string => Boolean(value?.trim()));

	for (const countryCode of countryCandidates) {
		const regionId = await resolveRegionIdForCountry(countryCode, regions);
		if (regionId) return regionId;
	}

	const eurRegion = regions.find(
		(region) => normalizeCurrencyCode(region.currency_code) === "EUR",
	);
	if (eurRegion) return eurRegion.id;
	return regions[0]?.id ?? null;
}

export async function initRegionState(
	detectedCountryCode?: string | null,
	force = false,
): Promise<void> {
	if (regionState.initialized && !force) return;
	if (initPromise && !force) return initPromise;

	initPromise = (async () => {
		regionState.loading = true;
		regionState.error = null;
		try {
			const regions = await fetchActiveRegions();
			regionState.regions = regions;
			const selectedRegionId = await detectDefaultRegionId(
				regions,
				detectedCountryCode,
			);
			regionState.selectedRegionId = selectedRegionId;
			if (selectedRegionId) {
				writeStoredRegionId(selectedRegionId);
			}
			regionState.initialized = true;
		} catch (error) {
			regionState.error =
				error instanceof Error ? error.message : "Failed to initialize region";
			throw error;
		} finally {
			regionState.loading = false;
			initPromise = null;
		}
	})();

	return initPromise;
}

export function setSelectedRegion(regionId: string) {
	const region = regionState.regions.find((item) => item.id === regionId);
	if (!region) return;
	regionState.selectedRegionId = region.id;
	writeStoredRegionId(region.id);
}

export function regionOptionLabel(region: StorefrontRegion): string {
	const currency = normalizeCurrencyCode(region.currency_code);
	return `${currency} (${region.name})`;
}
