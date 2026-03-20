<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DropdownMenu } from 'bits-ui';
	import { client } from '$lib/client.js';

	interface Props {
		regionId: string;
		onAddCountries?: () => void;
		/** Increment after mutations to refetch the list. */
		refreshNonce?: number;
	}

	let { regionId, onAddCountries, refreshNonce = 0 }: Props = $props();

	let addCountriesOpen = $state(false);

	function handleAddCountriesClick() {
		if (onAddCountries) {
			onAddCountries();
			return;
		}
		addCountriesOpen = true;
	}

	type CountryRow = { id: string; name: string; code: string };
	let countries = $state<CountryRow[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		regionId;
		refreshNonce;
		if (!regionId) {
			countries = [];
			error = null;
			return;
		}
		let cancelled = false;
		loading = true;
		error = null;
		client.regions({ id: regionId }).countries
			.get()
			.then((res) => {
				if (cancelled) return;
				loading = false;
				if (res.error) {
					error = String((res.error as { value?: { message?: string } })?.value?.message ?? res.error);
					countries = [];
					return;
				}
				const raw = res.data as unknown;
				const rows = Array.isArray(raw) ? raw : (raw as { rows?: unknown[] })?.rows ?? [];
				countries = rows.map((c: { id?: string; display_name?: string; iso_2?: string }) => ({
					id: c.id ?? '',
					name: c.display_name ?? c.iso_2 ?? '',
					code: (c.iso_2 ?? '').toUpperCase()
				}));
			})
			.catch((e) => {
				if (cancelled) return;
				loading = false;
				error = e instanceof Error ? e.message : String(e);
				countries = [];
			});
		return () => {
			cancelled = true;
		};
	});

	let searchQuery = $state('');

	const filteredCountries = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return countries;
		return countries.filter(
			(c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
		);
	});

	let selectedIds = $state<Set<string>>(new Set());

	const allSelected = $derived(
		filteredCountries.length > 0 && filteredCountries.every((c) => selectedIds.has(c.id))
	);

	function toggleAll() {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(filteredCountries.map((c) => c.id));
		}
	}

	function toggleOne(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
	}
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<h2 class="text-lg font-semibold">Countries</h2>
		<Button type="button" variant="outline" size="sm" onclick={handleAddCountriesClick}>
			Add countries
		</Button>
	</div>

	<div class="border-b px-6 py-3">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				placeholder="Search countries…"
				bind:value={searchQuery}
				class="h-9 w-56 pl-9 rounded-md"
			/>
		</div>
	</div>

	{#if loading}
		<div class="px-6 py-8 text-center text-muted-foreground">Loading…</div>
	{:else if error}
		<div class="px-6 py-8 text-center text-destructive">{error}</div>
	{:else}
	<div class="overflow-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b text-left">
					<th class="w-10 px-6 py-3">
						<input
							type="checkbox"
							checked={allSelected}
							onchange={toggleAll}
							class="size-4 rounded border-input"
						/>
					</th>
					<th class="px-4 py-3 font-medium text-muted-foreground">Name</th>
					<th class="px-4 py-3 font-medium text-muted-foreground">Code</th>
					<th class="w-12 px-4 py-3"></th>
				</tr>
			</thead>
			<tbody>
				{#each filteredCountries as country (country.id)}
					<tr class="border-b last:border-b-0 hover:bg-muted/50">
						<td class="px-6 py-3">
							<input
								type="checkbox"
								checked={selectedIds.has(country.id)}
								onchange={() => toggleOne(country.id)}
								class="size-4 rounded border-input"
							/>
						</td>
						<td class="px-4 py-3">{country.name}</td>
						<td class="px-4 py-3 font-mono text-muted-foreground">{country.code}</td>
						<td class="px-4 py-3">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-7 items-center justify-center rounded-md hover:bg-muted"
									aria-label="Row actions for {country.name}"
								>
									<MoreHorizontal class="size-4" />
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-32 rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										<DropdownMenu.Item
											textValue="Remove"
											class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
										>
											Remove
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-6 py-8 text-center text-muted-foreground">
							No countries found.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{/if}
</div>

<Sheet.Root bind:open={addCountriesOpen}>
	<Sheet.Content side="right" class="flex w-full flex-col sm:max-w-lg">
		<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
			<Sheet.Title>Add countries</Sheet.Title>
			<Sheet.Description>Select countries to assign to this region.</Sheet.Description>
		</Sheet.Header>
		<Sheet.Footer class="mt-auto flex justify-end gap-2 border-t p-4">
			<Button type="button" variant="outline" onclick={() => (addCountriesOpen = false)}>Close</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
