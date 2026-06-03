import { client } from '$lib/api/client';
import { rowsFromPaginated } from '$lib/api/storefront-api';

export type CheckoutCountryOption = { code: string; name: string };

type CountryRow = {
	iso_2?: string | null;
	display_name?: string | null;
	name?: string | null;
};

export async function fetchAllCheckoutCountries(): Promise<CheckoutCountryOption[]> {
	const all: CheckoutCountryOption[] = [];
	let page = 1;
	let hasNext = true;

	while (hasNext) {
		const res = await client.admin.regions.countries.get({
			query: { page, limit: 100 }
		});
		if (res.error || !res.data) break;

		const { rows } = rowsFromPaginated<CountryRow>(res.data);
		for (const row of rows) {
			const code = String(row.iso_2 ?? '').toUpperCase();
			const name =
				String(row.display_name ?? row.name ?? '').trim() || code;
			if (code) all.push({ code, name });
		}

		hasNext = res.data.pagination?.has_next_page ?? false;
		page += 1;
	}

	const seen = new Set<string>();
	return all
		.filter((country) => {
			if (seen.has(country.code)) return false;
			seen.add(country.code);
			return true;
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function checkoutCountryLabel(
	code: string | null | undefined,
	countries: CheckoutCountryOption[]
): string {
	const raw = String(code ?? '').trim();
	if (!raw) return '';
	const normalized = raw.toUpperCase();
	const match = countries.find(
		(country) =>
			country.code === normalized ||
			country.name.toLowerCase() === raw.toLowerCase()
	);
	return match?.name ?? raw;
}
