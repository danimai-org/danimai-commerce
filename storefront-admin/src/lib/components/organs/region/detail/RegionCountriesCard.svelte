<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import RegionAddCountriesSheet from './RegionAddCountriesSheet.svelte';
	import { Country } from 'country-state-city';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';
	let { regionId } = $props<{ regionId: string }>();
	const listQuery = { page: 1, limit: 1000 } as const;
	type CountryApiRow = {
		id: string;
		iso_2: string;
		name?: string;
		display_name?: string;
	};

	function unwrapCountriesPayload(body: unknown): CountryApiRow[] {
		if (Array.isArray(body)) return body as CountryApiRow[];
		if (body && typeof body === 'object' && 'data' in body) {
			const inner = (body as { data: unknown }).data;
			if (Array.isArray(inner)) return inner as CountryApiRow[];
		}
		return [];
	}

	const countriesQuery = createQuery(() => ({
		queryKey: ['region-countries', regionId, listQuery.page, listQuery.limit],
		queryFn: async () => {
			const res = await client.regions({ id: regionId }).countries.get({ query: listQuery });
			if (res.error) throw res.error;
			return unwrapCountriesPayload(res.data);
		},
		enabled: Boolean(regionId)
	}));

	type CountryRow = { id: string; name: string; code: string };

	const countries = $derived.by((): CountryRow[] =>
		(countriesQuery.data ?? []).map((row) => ({
			id: String(row.id),
			name: String(row.display_name ?? row.name ?? '').trim() || String(row.iso_2).toUpperCase(),
			code: String(row.iso_2).toUpperCase()
		}))
	);

	const loading = $derived(countriesQuery.isPending);
	const error = $derived.by(() => {
		if (!countriesQuery.isError) return null;
		const e = countriesQuery.error;
		return e instanceof Error ? e.message : String(e);
	});

	let searchQuery = $state('');
	let addCountriesOpen = $state(false);

	const initialSelectedIsoCodes = $derived(countries.map((c) => c.code));

	async function handleAddCountries(ids: string[]) {
		try {
			const res = await client.regions({ id: regionId }).countries.post({ ids });
			if (res.error) throw new Error(res.error.value?.message ?? 'Failed to add countries');
			await countriesQuery.refetch();
		} catch (e: unknown) {
			const err = e instanceof Error ? e : new Error(String(e));
			console.error(err.message);
		}
	}

	async function handleRemoveCountry(id: string) {
		try {
			const res = await client.regions({ id: regionId }).countries.delete({ ids: [id] });
			if (res.error) throw new Error(res.error.value?.message ?? 'Failed to remove country');
			await countriesQuery.refetch();
		} catch (e: unknown) {
			const err = e instanceof Error ? e : new Error(String(e));
			console.error(err.message);
		}
	}

	const filteredCountries = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return countries;
		return countries.filter(
			(c) => String(c.name).toLowerCase().includes(q) || String(c.code).toLowerCase().includes(q)
		);
	});

	const count = $derived(countries.length);
</script>

<div class="rounded-xl border bg-card shadow-sm">
	<div class="flex items-start justify-between gap-4 border-b px-6 py-4">
		<div>
			<h3 class="text-lg font-semibold text-foreground">Selected countries</h3>
			<p class="text-sm text-muted-foreground">
				{#if loading}
					Loading…
				{:else}
					{count}
					{count === 1 ? 'country' : 'countries'} assigned to this region
				{/if}
			</p>
		</div>
		<Button type="button" variant="outline" size="sm" onclick={() => (addCountriesOpen = true)}
			>Add countries</Button
		>
	</div>

	<div class="border-b bg-muted/5 px-6 py-3">
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				placeholder="Search by name or ISO code..."
				bind:value={searchQuery}
				class="h-9 w-full max-w-md rounded-md bg-background pl-9"
			/>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center px-6 py-12">
			<div
				class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
			></div>
			<span class="ml-3 text-sm text-muted-foreground">Fetching countries...</span>
		</div>
	{:else if error}
		<div class="px-6 py-12 text-center text-destructive">
			<p class="text-sm font-medium">{error}</p>
		</div>
	{:else}
		<div class="overflow-auto">
			<table class="w-full text-left text-sm">
				<thead
					class="border-b bg-muted/20 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
				>
					<tr>
						<th class="px-6 py-3">Country Name</th>
						<th class="px-4 py-3">Country Code</th>
						<th class="w-16 px-4 py-3 text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each filteredCountries as country (country.id)}
						{@const lc = Country.getCountryByCode(country.code)}
						<tr class="transition-colors hover:bg-muted/30">
							<td class="px-6 py-3 font-medium text-foreground">
								{#if lc?.flag}
									<span class="mr-1.5" aria-hidden="true">{lc.flag}</span>
								{/if}
								{country.name}
							</td>
							<td class="px-4 py-3">
								<span
									class="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground uppercase"
								>
									{country.code}
								</span>
							</td>
							<td class="px-4 py-3 text-right">
								<button
									type="button"
									class="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
									aria-label="Remove country"
									onclick={() => handleRemoveCountry(country.id)}
								>
									<Trash2 class="size-4" />
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="3" class="px-6 py-12 text-center text-muted-foreground">
								{countries.length === 0 ? 'No countries found.' : 'No countries match your search.'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<RegionAddCountriesSheet
	bind:open={addCountriesOpen}
	initialSelectedIds={initialSelectedIsoCodes}
	onPick={handleAddCountries}
/>
