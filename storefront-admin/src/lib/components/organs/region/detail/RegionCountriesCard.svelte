<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import RegionAddCountriesSheet from './RegionAddCountriesSheet.svelte';
	import { DropdownMenu } from 'bits-ui';
	import { SvelteSet } from 'svelte/reactivity';
	import { client } from '$lib/client.js';

	interface Props {
		regionId: string;
	}

	let { regionId }: Props = $props();

	let addCountriesOpen = $state(false);
	let countries = $state<CountryRow[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let selectedIds = new SvelteSet<string>();

	type CountryRow = { id: string; name: string; code: string };

	function mapApiCountries(data: unknown): CountryRow[] {
		const list = Array.isArray(data)
			? data
			: data != null && typeof data === 'object' && Array.isArray((data as { rows?: unknown }).rows)
				? (data as { rows: unknown[] }).rows
				: [];
		return list
			.map((item) => {
				const c = item as Record<string, unknown>;
				const id = c.id != null ? String(c.id) : '';
				const iso2 = String(c.iso_2 ?? '').trim();
				const name = String(c.name ?? '').trim();
				const displayName = String(c.display_name ?? '').trim();
				const label = displayName || name || iso2 || '—';
				return { id, name: label, code: iso2.toUpperCase() };
			})
			.filter((row) => row.id.length > 0);
	}

	$effect(() => {
		if (!regionId) return;

		let active = true;
		loading = true;
		error = null;

		client
			.regions({ id: regionId })
			.countries.get({ query: { limit: 1000 } })
			.then((res) => {
				if (!active) return;
				if (res.error) throw res.error;
				countries = mapApiCountries(res.data);
			})
			.catch((e) => {
				if (!active) return;
				error = e.message || String(e);
			})
			.finally(() => {
				if (active) loading = false;
			});

		return () => (active = false);
	});

	async function handleRemoveCountry(id: string) {
		try {
			const res = await client
				.regions({ id: regionId as string })
				.countries.delete({ ids: [id] as string[] });
			if (res.error) throw new Error(res.error.value?.message ?? 'Failed to remove country');
			countries = countries.filter((c) => c.id !== id);
			selectedIds.delete(id);
		} catch (e: unknown) {
			const error = e instanceof Error ? e : new Error(String(e));
			console.error(error.message);
		}
	}

	const filteredCountries = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return countries;
		return countries.filter(
			(c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
		);
	});

	const allSelected = $derived(
		filteredCountries.length > 0 && filteredCountries.every((c) => selectedIds.has(c.id))
	);

	function toggleAll() {
		if (allSelected) {
			selectedIds.clear();
		} else {
			filteredCountries.forEach((c) => selectedIds.add(c.id));
		}
	}
</script>

<div class="rounded-xl border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<div>
			<h2 class="text-lg font-semibold text-foreground">Countries</h2>
			<p class="text-sm text-muted-foreground">Countries assigned to this region</p>
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
				class="h-9 w-64 rounded-md bg-background pl-9"
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
						<th class="w-12 px-6 py-3">
							<input
								type="checkbox"
								checked={allSelected}
								onchange={toggleAll}
								class="size-4 cursor-pointer rounded border-input accent-primary"
							/>
						</th>
						<th class="px-4 py-3">Country Name</th>
						<th class="px-4 py-3">Country Code</th>
						<th class="w-16 px-4 py-3 text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each filteredCountries as country (country.id)}
						<tr class="transition-colors hover:bg-muted/30">
							<td class="px-6 py-3">
								<input
									type="checkbox"
									checked={selectedIds.has(country.id)}
									onchange={() =>
										selectedIds.has(country.id)
											? selectedIds.delete(country.id)
											: selectedIds.add(country.id)}
									class="size-4 cursor-pointer rounded border-input accent-primary"
								/>
							</td>
							<td class="px-4 py-3 font-medium text-foreground">{country.name}</td>
							<td class="px-4 py-3">
								<span
									class="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground uppercase"
								>
									{country.code}
								</span>
							</td>
							<td class="px-4 py-3 text-right">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
									>
										<MoreHorizontal class="size-4" />
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content
											class="z-50 min-w-32 rounded-lg border bg-popover p-1 shadow-lg"
											sideOffset={5}
											align="end"
										>
											<DropdownMenu.Item
												onSelect={() => handleRemoveCountry(country.id)}
												class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
											>
												<Trash2 class="size-4" />
												Remove from Region
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="px-6 py-12 text-center text-muted-foreground"
								>No countries found.</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<RegionAddCountriesSheet bind:open={addCountriesOpen} />
