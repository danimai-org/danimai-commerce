<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Search from '@lucide/svelte/icons/search';
	import { cn } from '$lib/utils.js';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { Country, type ICountry } from 'country-state-city';

	const countryByIso = (() => {
		const map = new SvelteMap<string, ICountry>();
		for (const x of Country.getAllCountries()) {
			map.set(String(x.isoCode).toUpperCase(), x);
		}
		return map;
	})();

	function localCountry(iso: string | undefined): ICountry | undefined {
		if (!iso) return undefined;
		return countryByIso.get(String(iso).toUpperCase());
	}
	let {
		open = $bindable(false),
		initialSelectedIds = [] as string[],
		onPick
	} = $props<{
		open?: boolean;
		initialSelectedIds?: string[];
		onPick?: (ids: string[]) => void;
	}>();

	let search = $state('');
	let selectedIds = new SvelteSet<string>();

	const rows = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return Country.getAllCountries();
		return Country.getAllCountries().filter((c) => {
			const name = String(c.name).toLowerCase();
			const code = String(c.isoCode).toLowerCase();
			return name.includes(q) || code.includes(q);
		});
	});

	const allRowsSelected = $derived(
		rows.length > 0 && rows.every((c) => selectedIds.has(String(c.isoCode)))
	);

	$effect(() => {
		if (!open) {
			search = '';
			selectedIds.clear();
			return;
		}
		search = '';
		selectedIds.clear();
		for (const id of initialSelectedIds) {
			selectedIds.add(String(id));
		}
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex h-full w-full flex-col sm:max-w-lg">
		<Sheet.Header class="border-b px-6 py-4">
			<Sheet.Title>Add countries</Sheet.Title>
			<Sheet.Description>Select unassigned countries to add to this region.</Sheet.Description>
		</Sheet.Header>

		<div class="border-b px-6 py-3">
			<div class="relative">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search by name or ISO code..."
					bind:value={search}
					class="h-9 rounded-md bg-background pl-9"
				/>
			</div>
		</div>

		<div class="min-h-0 flex-1 overflow-auto">
			{#if rows.length === 0}
				<div class="flex min-h-[12rem] items-center justify-center px-6 py-12">
					<p class="text-center text-sm text-muted-foreground">No countries match your search.</p>
				</div>
			{:else}
				<table class="w-full text-sm">
					<thead
						class="sticky top-0 z-10 border-b bg-card text-left text-[10px] font-bold tracking-wider text-muted-foreground uppercase shadow-sm"
					>
						<tr>
							<th class="w-12 py-3.5 pr-2 pl-6 align-middle">
								<input
									type="checkbox"
									checked={allRowsSelected}
									onchange={() => {
										if (allRowsSelected) {
											selectedIds.clear();
										} else {
											for (const c of rows) {
												selectedIds.add(String(c.isoCode));
											}
										}
									}}
									class="size-4 cursor-pointer rounded border-input accent-primary"
								/>
							</th>
							<th class="py-3.5 pr-4 align-middle">Country</th>
							<th class="py-3.5 pr-6 align-middle">Code</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each rows as c (c.isoCode)}
							{@const lc = localCountry(String(c.isoCode))}
							<tr class={cn('transition-colors hover:bg-muted/30')}>
								<td class="py-3.5 pr-2 pl-6 align-middle">
									<input
										type="checkbox"
										checked={selectedIds.has(String(c.isoCode))}
										onchange={() => {
											const id = String(c.isoCode);
											if (selectedIds.has(id)) {
												selectedIds.delete(id);
											} else {
												selectedIds.add(id);
											}
										}}
										class="size-4 cursor-pointer rounded border-input accent-primary"
									/>
								</td>
								<td class="py-3.5 pr-4 align-middle leading-snug font-medium">
									{#if lc?.flag}
										<span class="mr-2 inline-block align-middle" aria-hidden="true">{lc.flag}</span>
									{/if}
									<span class="align-middle">{c.name}</span>
								</td>
								<td class="py-3.5 pr-6 align-middle">
									<span
										class="inline-block rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-bold uppercase"
									>
										{String(c.isoCode).toUpperCase()}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>

		<Sheet.Footer class="mt-auto flex shrink-0 justify-end gap-2 border-t bg-card p-4">
			<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				type="button"
				disabled={selectedIds.size === 0}
				onclick={() => {
					onPick?.(Array.from(selectedIds).map(String));
					open = false;
				}}
			>
				Add selected
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
